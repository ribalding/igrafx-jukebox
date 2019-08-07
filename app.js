var express = require('express'); // Express web server framework
var app = express();
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var client_id = 'ca7a77180878452a93bde76fa726333b'; // Your client id
var client_secret = 'a0435d5c26ac4b2e9fcd6e4c49a06136'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var sql = require('mssql');

var addTrackQuery = "INSERT INTO history (SpotifyId, [TrackTitle], [TrackArtist]) VALUES (@spotify_id, @track_title, @track_artist)";

console.log('Listening on 8888');
http.listen(8888);

app.use(express.static(__dirname))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {
  var scope = 'user-read-private user-read-email user-read-currently-playing user-library-read playlist-modify-public playlist-modify-private playlist-modify';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/callback', function (req, res) {
  var code = req.query.code || null;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    console.log(error);
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      var refresh_token = body.refresh_token;

      var spotifyLayer = require('./spotifylayer')(access_token, request);

      var sqlConfig = {
        user: 'fred',
        password: 'bedrock',
        server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
        database: 'igrafx_jukebox',
      };

      var addTrackToHistory = function (pool, idString, trackTitle, trackArtist) {
        try {
          pool.request()
            .input('spotify_id', sql.NVarChar(255), idString)
            .input('track_title', sql.NVarChar(255), trackTitle)
            .input('track_artist', sql.NVarChar(255), trackArtist)
            .query(addTrackQuery);
        } catch (err) {
          // TODO
        }
      }
      
      var playlistUrl = 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1';
      var updatePlaylistData = function (callback) {
        spotifyLayer.getCurrentlyPlaying(function (cpError, cpResponse, currentlyPlaying) {
          spotifyLayer.getPlaylistData(function (plError, plResponse, playlistData) {
            if (currentlyPlaying && playlistData && playlistData.items) {
              var toBeRemoved = [];
              if (currentlyPlaying && playlistData.items.length && currentlyPlaying.is_playing && currentlyPlaying.context.href === playlistUrl) {
                var toBeRemoved = spotifyLayer.getTracksToBeRemoved(currentlyPlaying, playlistData);
                if (toBeRemoved.length) {
                  spotifyLayer.removePlayedTracks(toBeRemoved);
                }
              }
              // Add a random track if we are on the second to last track in the playlist
              if (spotifyLayer.currentlyPlayingIsSecondToLastTrack(currentlyPlaying, playlistData)) {
                spotifyLayer.addRandomTrackToPlaylist(function (error, response, body) {
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

      updatePlaylistData(function (currentlyPlaying, playlistData) {
        var current = currentlyPlaying.item.id;
        init();
        res.redirect('/');
        setInterval(function () {
          updatePlaylistData(function(cp, pd){
            if (current !== cp.item.id) {
              io.emit('update playlist', {currentlyPlaying: cp, playlistData: pd})
              current = cp.item.id;
            }
          });
        }, 5000);
      });

      var init = function () {
        sql.connect(sqlConfig).then(pool => {
          app.get('/jukebox', function (req, jukeboxResponse) {
            updatePlaylistData(function (currentlyPlaying, playlistData) {
              jukeboxResponse.send({
                currentlyPlaying: currentlyPlaying,
                playlistData: playlistData
              });
            })
          });

          app.get('/search', function (req, res) {
            var searchString = req.query.searchString;
            spotifyLayer.search(searchString, function (error, response, body) {
              res.send({
                response: body
              });
            });
          });

          app.get('/add', function (req, res) {
            var idString = req.query.idString;
            var artist = req.query.artist;
            var track = req.query.title;
            spotifyLayer.addTrackToPlaylist(idString, function (error, response, body) {
              res.send({
                response: body
              });
              addTrackToHistory(pool, idString, track, artist);
              updatePlaylistData(function (currentlyPlaying, playlistData) {
                io.emit('update playlist', { currentlyPlaying: currentlyPlaying, playlistData: playlistData });
              });
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
