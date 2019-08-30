module.exports = function (app, spotifyManager, io, emitter) {
  this.app = app;
  this.spotifyManager = spotifyManager;
  this.io = io;
  this.emitter = emitter;
  this.playlistUrl = 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1';

  this.init = function() {
    this.app.get('/jukebox', function (req, jukeboxResponse) {
      this.spotifyManager.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
        jukeboxResponse.send({
          currentlyPlaying: currentlyPlaying,
          playlistData: playlistData,
          playState: playState
        });
      }.bind(this));
    }.bind(this));

    this.app.get('/search', function (req, res) {
      var searchString = req.query.searchString;
      this.spotifyManager.search({searchString: searchString}, function (error, response, body) {
        res.send({ response: body });
      }.bind(this));
    }.bind(this));

    this.app.get('/add', function (req, res) {
      var idString = req.query.idString;
      var artist = req.query.artist;
      var track = req.query.title;
      this.spotifyManager.addTrackToPlaylist(idString, function (error, response, body) {
        res.send({ response: body });
        // addTrackToHistory(pool, idString, track, artist);
        this.updateAndEmit();
      }.bind(this));
    }.bind(this));

    this.app.get('/remove', function(req, res){
      var idString = req.query.idString;
      if(this.spotifyManager.randomTrackIds[idString]){
        this.spotifyManager.removeTracks([{uri: 'spotify:track:' + idString}], function(error, response, body){
          res.send({ response: body });
          this.updateAndEmit();
        }.bind(this));
      }
      else {
        res.send();
      }
    }.bind(this));

    this.app.get('/play', function(req, res){
      this.spotifyManager.play();
      this.emitPlayState('playing');
      res.send();
    }.bind(this));

    this.app.get('/pause', function(req, res){
      this.spotifyManager.pause();
      this.emitPlayState('paused');
      res.send();
    }.bind(this));

    this.app.get('/refresh', function(req, res){
      console.log('before - ' + spotifyManager.access_token);
      this.spotifyManager.getNewToken(function() {
        console.log('after - ' + spotifyManager.access_token);
      });
      res.send({});
    }.bind(this));
  };

  this.emitter.on('update playlist', function(data){
    this.io.emit('update playlist', data);
  }.bind(this))

  this.updateAndEmit = function(currentlyPlaying, playlistData, playState) {
    this.spotifyManager.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
      this.io.emit('update playlist', { currentlyPlaying: currentlyPlaying, playlistData: playlistData, playState: playState });
    }.bind(this));
  }

  this.emitPlayState = function(playState) {
    this.io.emit('update playstate', { playState: playState });
  }
}
