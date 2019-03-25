
exports.start = function(){
  if (!error && response.statusCode === 200) {
    var access_token = body.access_token;
    var refresh_token = body.refresh_token;
    var currentlyPlaying;
    var playlistData;
    var headers = {
      'Authorization': 'Bearer ' + access_token
    };

    var getSearchOptions = function(searchString) {
      return {
        url: 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(searchString) + '&type=track',
        headers: headers,
        json: true
      }
    };

    var getAddToPlaylistOptions = function(idString) {
      return {
        url: 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1/tracks?uris=' + encodeURIComponent(idString),
        headers: headers,
        json: true
      }
    }

    var currentlyPlayingIsSecondToLastTrack = function(currentlyPlaying, playlist) {
      var tracks = playlist.items
      if (tracks.length && tracks.length > 2) {
        return currentlyPlaying.item.id === tracks[tracks.length - 2].track.id;
      }
      return true;
    }

    function addTrackToPlaylist(idString, callback) {
      var options = getAddToPlaylistOptions(idString);
      request.post(options, callback);
    }

    function addRandomTrackToPlaylist(callback) {
      var options = {
        url: getUrlForRandomSong(),
        headers: headers,
        json: true
      }
      request.get(options, function(error, response, body) {
        randomTrackData = body.tracks.items[0];
        var idString = "spotify:track:" + body.tracks.items[0].id;
        addTrackToPlaylist(idString, callback);
      });
    }

    function getCurrentlyPlaying(callback) {
      var currentlyPlayingOptions = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing?market=us',
        headers: headers,
        json: true
      };

      request.get(currentlyPlayingOptions, function(error, response, body) {
        if(callback) {
          callback(error, response, body);
        }
      });
    }

    function getPlaylistData(callback) {
      var playlistOptions = {
        url: 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1/tracks',
        headers: headers,
        json: true
      };

      request.get(playlistOptions, function (error, response, body) {
        if(callback) {
          callback(error, response, body);
        }
      });
    }

    function removePlayedTracks(toBeRemoved) {
      var options = {
        url: 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1/tracks',
        headers: headers,
        json: true,
        body: {
          tracks: getDataForTrackRemoval(toBeRemoved)
        },
        contentType: 'application/json',
      }
      request.delete(options, function(error, response, body) {
        console.log(body)
      });
    }

    function getDataForTrackRemoval(toBeRemoved) {
      return toBeRemoved.map(function(item) {
        return {
          uri: "spotify:track:" + item
        }
      });
    }

    function getTracksToBeRemoved(currentlyPlaying, playlistData) {
      var toBeRemoved = [];
      for (var i = 0; i < playlistData.items.length; i++) {
        var item = playlistData.items[i];
        var trackId = item.track.id;
        if (trackId === currentlyPlaying.item.id) {
          break;
        }
        toBeRemoved.push(trackId);
      }
      return toBeRemoved;
    }

    function getUrlForRandomSong() {
      var searchStringArray = ['%25a%25', 'a%25', '%25e%25', 'e%25', '%25i%25', 'i%25', '%25o%25', 'o%25'];
      var randomSearchString = searchStringArray[Math.floor(Math.random() * 8)];
      var randomOffset = Math.floor(Math.random() * 1000) + 1;
      return "https://api.spotify.com/v1/search?query=" + randomSearchString + "&offset=" + randomOffset + "&limit=1&type=track&market=US";
    }

    var randomTrackData;
    var playlistUrl = 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1';
    var updatePlaylistData = function(callback) {
      getCurrentlyPlaying(function(cpError, cpResponse, currentlyPlaying) {
        getPlaylistData(function(plError, plResponse, playlistData) {
          if (currentlyPlaying && playlistData && playlistData.items) {
            var toBeRemoved = [];
            if (currentlyPlaying && playlistData.items.length && currentlyPlaying.is_playing && currentlyPlaying.context.href === playlistUrl) {
              var toBeRemoved = getTracksToBeRemoved(currentlyPlaying, playlistData);
              if (toBeRemoved.length) {
                removePlayedTracks(toBeRemoved);
              }
            }
            if (currentlyPlayingIsSecondToLastTrack(currentlyPlaying, playlistData)) {
              addRandomTrackToPlaylist(function(error, response, body) {
                playlistData.items.push({
                  track: randomTrackData
                });
                if (callback) {
                  callback(currentlyPlaying, playlistData);
                }
              });
            }
            else if (callback) {
              callback(currentlyPlaying, playlistData);
            }
          }
        });
      });
    }

    updatePlaylistData(function(currentlyPlaying, playlistData) {
      init();
      res.redirect('/');
      setInterval(function() {
        updatePlaylistData();
      }, 5000);
    });

    var init = function() {
      app.get('/jukebox', function(req, jukeboxResponse) {
        updatePlaylistData(function(currentlyPlaying, playlistData) {
          jukeboxResponse.send({
            currentlyPlaying: currentlyPlaying,
            playlistData: playlistData
          });
        })
      });

      app.get('/search', function(req, res) {
        var searchString = req.query.searchString;
        var options = getSearchOptions(searchString);
        request.get(options, function(error, response, body) {
          res.send({
            response: body
          });
        });
      });

      app.get('/add', function(req, res) {
        var idString = req.query.idString;
        addTrackToPlaylist(idString, function(error, response, body) {
          res.send({
            response: body
          });
        });
      });
    }

  } else {
    // res.redirect('/#' +
    //   querystring.stringify({
    //     error: 'invalid_token'
    //   }));
  }
});
});

// app.get('/refresh_token', function(req, res) {

// requesting access token from refresh token
//   var refresh_token = req.query.refresh_token;
//   var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers: {
//       'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
//     },
//     form: {
//       grant_type: 'refresh_token',
//       refresh_token: refresh_token
//     },
//     json: true
//   };
//
//   request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       var access_token = body.access_token;
//       res.send({
//         'access_token': access_token
//       });
//     }
//   });
// });
};