module.exports = function (spotifyLayer, emitter, playlist_id) {
  this.spotifyLayer = spotifyLayer;
  this.emitter = emitter;
  this.playlist_id = playlist_id;
  this.playlistUrl = 'https://api.spotify.com/v1/playlists/' + playlist_id;
  this.baseUrl = 'https://api.spotify.com/v1';
  this.randomTrackIds = {};
  this.updateInterval = 5000;
  this.init = function() {
    this.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
      this.currentlyPlaying = currentlyPlaying && currentlyPlaying.item ? currentlyPlaying.item.id : null;
      this.playState = playState;
      setInterval(function () {
        this.updatePlaylistData(function(cp, pd, ps){
          var newCurrentlyPlaying = cp && cp.item ? cp.item.id : null;
          if (this.currentlyPlaying !== newCurrentlyPlaying || ps !== this.playState) {
            this.emitter.emit('update playlist', {currentlyPlaying: cp, playlistData: pd, playState: ps});
            this.currentlyPlaying = newCurrentlyPlaying;
            this.playState = ps;
          }
        }.bind(this));
      }.bind(this), this.updateInterval);
    }.bind(this));
  };

  this.updatePlaylistData = function (callback) {
    this.getUpdatedData(function (cpError, cpResponse, currentlyPlaying, plError, plResponse, playlistData) {
      var curTrackIsInPlaylist = currentlyPlaying && currentlyPlaying.context && currentlyPlaying.context.href === this.playlistUrl;
      var playState = 'stopped';

      if (curTrackIsInPlaylist) {
        playState = currentlyPlaying.is_playing ? 'playing' : 'paused';
        this.maybeRemoveTracks(currentlyPlaying, playlistData);
        // Add a random track if we are on the last track in the playlist
        if (this.currentlyPlayingIsLastTrack(currentlyPlaying, playlistData)) {
          this.addRandomTrackToPlaylist(function (error, response, body) {
            this.getUpdatedData(function (cpError, cpResponse, currentlyPlaying, plError, plResponse, playlistData) {
              if (callback) {
                callback(currentlyPlaying, playlistData, playState);
              }
            }.bind(this));
          }.bind(this));
        }
        else if (callback) {
          this.identifyRandomTracks(playlistData, spotifyLayer);
          callback(currentlyPlaying, playlistData, playState);
        }
      }
      else if (callback) {
        callback(currentlyPlaying, playlistData, playState)
      }
    }.bind(this));
  }

  this.getUpdatedData = function (callback) {
    this.spotifyLayer.getCurrentlyPlaying(function (cpError, cpResponse, currentlyPlaying) {
      this.spotifyLayer.getPlaylistData(function (plError, plResponse, playlistData) {
        if (callback) {
          this.identifyRandomTracks(playlistData, spotifyLayer);
          callback(cpError, cpResponse, currentlyPlaying, plError, plResponse, playlistData);
        }
      }.bind(this));
    }.bind(this));
  };

  this.identifyRandomTracks = function (playlistData) {
    if (playlistData.items && playlistData.items.length) {
      for (var i = 0; i < playlistData.items.length; i++) {
        playlistData.items[i].track.isRandom = this.randomTrackIds[playlistData.items[i].track.id];
      }
    }
  }

  this.maybeRemoveTracks = function (currentlyPlaying, playlistData) {
    if (playlistData && playlistData.items && playlistData.items.length) {
      var toBeRemoved = this.getTracksToBeRemoved(currentlyPlaying, playlistData);
      if (toBeRemoved.length) {
        this.spotifyLayer.removeTracks(this.mapDataForTrackRemoval(toBeRemoved));
      }
    }
  }

  this.mapDataForTrackRemoval = function (toBeRemoved) {
    return toBeRemoved.map(function (trackId) {
      return { uri: "spotify:track:" + trackId }
    });
  };

  this.getTracksToBeRemoved = function (currentlyPlaying, playlistData) {
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

  this.addRandomTrackToPlaylist = function (callback) {
    var url = this.getUrlForRandomSong();
    this.search({ 
      url: url 
    }, function (error, response, body) {
      var randomTrackData = body.tracks.items[0];
      var id = randomTrackData.id;
      this.randomTrackIds[id] = true;
      this.addTrackToPlaylist(id, callback);
    }.bind(this));
  };

  this.addTrackToPlaylist = function(id, callback) {
    this.spotifyLayer.addTrackToPlaylist(id, callback);
  }

  this.search = function(config, callback) {
    this.spotifyLayer.search(config, callback);
  }

  this.removeTracks = function (toBeRemoved, callback) {
    this.spotifyLayer.removeTracks(toBeRemoved, callback);
  }

  this.play = function() {
    this.spotifyLayer.play();
  }

  this.pause = function() {
    this.spotifyLayer.pause();
  }
  
  /**
   *   Construct a search url containing a random single character and a random offset to achieve the effect of a "random" search 
   */
  this.getUrlForRandomSong = function () {
    var searchStringArray = ['%25a%25', 'a%25', '%25e%25', 'e%25', '%25i%25', 'i%25', '%25o%25', 'o%25'];
    var randomSearchString = searchStringArray[Math.floor(Math.random() * 8)];
    var randomOffset = Math.floor(Math.random() * 1000) + 1;
    return this.baseUrl + "/search?query=" + randomSearchString + "&offset=" + randomOffset + "&limit=1&type=track&market=US";
  }

  /**
   *   Return true if the currently playing track is only remaining song in the playlist
   */
  this.currentlyPlayingIsLastTrack = function (currentlyPlaying, playlist) {
    var tracks = playlist.items
    if (tracks && tracks.length && tracks.length > 2) {
      return currentlyPlaying.item.id === tracks[tracks.length - 2].track.id;
    }
    return true;
  };
};
