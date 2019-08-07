
module.exports = function (access_token, request) {
  return {
    baseUrl: 'https://api.spotify.com/v1',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },

    request: request,

    search: function(searchString, callback) {
      request.get({
        url: this.baseUrl + '/search?q=' + encodeURIComponent(searchString) + '&type=track',
        headers: this.headers,
        json: true
      }, callback);
    },

    /**
    *   Return true if the currently playing track is only remaining song in the playlist
    */
    currentlyPlayingIsLastTrack: function (currentlyPlaying, playlist) {
      var tracks = playlist.items
      if (tracks.length && tracks.length > 1) {
        return currentlyPlaying.item.id === tracks[tracks.length - 1].track.id;
      }
      return true;
    },

    addTrackToPlaylist: function (idString, callback) {
      request.post({
        url: this.baseUrl + '/playlists/3KtyHb6OPldYjyU4yzngi1/tracks?uris=' + encodeURIComponent(idString),
        headers: this.headers,
        json: true
      }, callback);
    },

    addRandomTrackToPlaylist: function (callback) {
      var options = {
        url: this.getUrlForRandomSong(),
        headers: this.headers,
        json: true
      }
      request.get(options, function (error, response, body) {
        randomTrackData = body.tracks.items[0];
        var idString = "spotify:track:" + randomTrackData.id;
        this.addTrackToPlaylist(idString, callback);
      }.bind(this));
    },

    getCurrentlyPlaying: function (callback) {
      var currentlyPlayingOptions = {
        url: this.baseUrl + '/me/player/currently-playing?market=us',
        headers: this.headers,
        json: true
      };

      request.get(currentlyPlayingOptions, function (error, response, body) {
        if (callback) {
          callback(error, response, body);
        }
      });
    },

    getPlaylistData: function (callback) {
      var playlistOptions = {
        url: this.baseUrl + '/playlists/3KtyHb6OPldYjyU4yzngi1/tracks',
        headers: this.headers,
        json: true
      };

      request.get(playlistOptions, function (error, response, body) {
        if (callback) {
          callback(error, response, body);
        }
      });
    },

    removePlayedTracks: function (toBeRemoved) {
      var options = {
        url: this.baseUrl + '/playlists/3KtyHb6OPldYjyU4yzngi1/tracks',
        headers: this.headers,
        json: true,
        body: {
          tracks: this.getDataForTrackRemoval(toBeRemoved)
        },
        contentType: 'application/json',
      }
      request.delete(options, function (error, response, body) {
        console.log(body)
      });
    },

    pause: function() {
      var options = {
        url: this.baseUrl + '/me/player/pause',
        headers: this.headers,
        json: true
      };
      request.put(options, function(error, response, body){
          console.log(body);
      });
    },

    play: function(){
      var options = {
        url: this.baseUrl + '/me/player/play',
        headers: this.headers,
        json: true
      };
      request.put(options, function(error, response, body){
          console.log(body);
      });
    },

    getDataForTrackRemoval: function (toBeRemoved) {
      return toBeRemoved.map(function (trackId) {
        return {
          uri: "spotify:track:" + trackId
        }
      });
    },

    getTracksToBeRemoved: function (currentlyPlaying, playlistData) {
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
    },

    getUrlForRandomSong: function () {
      var searchStringArray = ['%25a%25', 'a%25', '%25e%25', 'e%25', '%25i%25', 'i%25', '%25o%25', 'o%25'];
      var randomSearchString = searchStringArray[Math.floor(Math.random() * 8)];
      var randomOffset = Math.floor(Math.random() * 1000) + 1;
      return this.baseUrl + "/search?query=" + randomSearchString + "&offset=" + randomOffset + "&limit=1&type=track&market=US";
    }
  }
};
