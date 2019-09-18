module.exports = function (access_token, refresh_token, client_id, client_secret, request, playlistId) {
  this.access_token = access_token;
  this.playlistId = playlistId;
  this.baseUrl = 'https://api.spotify.com/v1';
  this.headers = { 'Authorization': 'Bearer ' + access_token };
  this.request = request;
  this.client_id = client_id;
  this.client_secret = client_secret;

  this.search = function(config, callback) {
    request.get({
      url: config.url || this.baseUrl + '/search?q=' + encodeURIComponent(config.searchString) + '&type=track',
      headers: this.headers,
      json: true
    }, callback);
  };

  this.getNewToken = function(callback) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer(this.client_id + ':' + this.client_secret).toString('base64'))
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        this.access_token = body.access_token;
        this.refresh_token = body.refresh_token;
        if (callback) {
          callback();
        }
      }
    }.bind(this));
  };

  this.addTrackToPlaylist = async function(id, callback) {
    var idString = 'spotify:track:' + id;
    var response = await request.post({
      url: this.baseUrl + '/playlists/' + this.playlistId + '/tracks?uris=' + encodeURIComponent(idString),
      headers: this.headers,
      json: true
    });
    var error = null;
    var body = null;
    callback(error, response, body);
  };

  this.getCurrentlyPlaying = function(callback) {
    var currentlyPlayingOptions = {
      url: this.baseUrl + '/me/player/currently-playing?market=us',
      headers: this.headers,
      json: true
    };

    request.get(currentlyPlayingOptions, function(error, response, body) {
      if (!error) {
        if (callback) {
          callback(error, response, body);
        }
      } else {
        this.getNewToken(function() {
          this.getCurrentlyPlaying(callback);
        }.bind(this));
      }
    }.bind(this));
  };

  this.getPlaylistData = function(callback) {
    var playlistOptions = {
      url: this.baseUrl + '/playlists/' + this.playlistId + '/tracks',
      headers: this.headers,
      json: true
    };

    request.get(playlistOptions, function(error, response, body) {
      if (!error) {
        if (callback) {
          callback(error, response, body);
        }
      } else {
        this.getNewToken(function() {
          this.getPlaylistData(callback);
        }.bind(this));
      }
    }.bind(this));
  };

  this.removeTracks = function(toBeRemoved, callback) {
    var options = {
      url: this.baseUrl + '/playlists/' + this.playlistId + '/tracks',
      headers: this.headers,
      json: true,
      body: {
        tracks: toBeRemoved
      },
      contentType: 'application/json',
    }
    request.delete(options, function(error, response, body) {
      if (!error) {
        if (callback) {
          callback(error, response, body);
        }
      } else {
        this.getNewToken(function() {
          this.removePlayedTracks(toBeRemoved, callback);
        }.bind(this));
      }
    }.bind(this));
  };

  this.pause = function() {
    var options = {
      url: this.baseUrl + '/me/player/pause',
      headers: this.headers,
      json: true
    };
    request.put(options);
  };

  this.play = function() {
    var options = {
      url: this.baseUrl + '/me/player/play',
      headers: this.headers,
      json: true
    };
    request.put(options);
  };
};
