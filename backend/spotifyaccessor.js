// Spotify Accessor Module //

module.exports = function (access_token, refresh_token, client_id, client_secret, request, playlistId) {
  this.access_token = access_token;
  this.refresh_token = refresh_token;
  this.playlistId = playlistId;
  this.baseUrl = 'https://api.spotify.com/v1';
  this.headers = { 'Authorization': 'Bearer ' + access_token };
  this.request = request;
  this.client_id = client_id;
  this.client_secret = client_secret;

  this.search = async function(config, callback) {
    var response = await request.get({
      url: config.url || this.baseUrl + '/search?q=' + encodeURIComponent(config.searchString) + '&type=' + encodeURIComponent(config.searchBy),
      headers: this.headers,
      json: true
    });

    if(callback) {
      callback(response);
    }
  };

  this.getNewToken = function(callback) {
    console.log('before - ' + this.access_token);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer(this.client_id + ':' + this.client_secret).toString('base64'))
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: this.refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        this.access_token = body.access_token;
        this.refresh_token = body.refresh_token;
        if (callback) {
          callback(body.access_token);
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

    if(callback) {
      callback(response);
    }
  };

  this.getCurrentlyPlaying = async function(callback) {
    var currentlyPlayingOptions = {
      url: this.baseUrl + '/me/player/currently-playing?market=us',
      headers: this.headers,
      json: true
    };

    var response = await request.get(currentlyPlayingOptions);
    if(callback) {
      callback(response);
    }
  };

  this.getPlaylistData = async function(callback) {
    var playlistOptions = {
      url: this.baseUrl + '/playlists/' + this.playlistId + '/tracks',
      headers: this.headers,
      json: true
    };

    var response = await request.get(playlistOptions);
    if(callback) {
      callback(response);
    }
  };

  this.removeTracks = async function(toBeRemoved, callback) {
    var options = {
      url: this.baseUrl + '/playlists/' + this.playlistId + '/tracks',
      headers: this.headers,
      json: true,
      body: {
        tracks: toBeRemoved
      },
      contentType: 'application/json',
    }
    var response = await request.delete(options);
    if(callback) {
      callback(response);
    }
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
