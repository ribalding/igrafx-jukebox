module.exports = function (app, jukeboxManager, io, emitter, databaseLayer) {
  this.app = app;
  this.jukeboxManager = jukeboxManager;
  this.io = io;
  this.emitter = emitter;
  this.databaseLayer = databaseLayer;

  this.init = function() {
    this.app.get('/jukebox', function (req, jukeboxResponse) {
      this.jukeboxManager.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
        jukeboxResponse.send({
          currentlyPlaying: currentlyPlaying,
          playlistData: playlistData,
          playState: playState
        });
      }.bind(this));
    }.bind(this));

    this.app.get('/search', function (req, res) {
      var searchString = req.query.searchString;
      this.jukeboxManager.search({searchString: searchString}, function (body) {
        res.send({ response: body });
      }.bind(this));
    }.bind(this));

    this.app.get('/add', function (req, res) {
      var idString = req.query.idString;
      var artist = req.query.artist;
      var track = req.query.title;
      this.jukeboxManager.addTrackToPlaylist(idString, function (body) {
        res.send({ response: body });
        if(idString && track && artist) {
          this.databaseLayer.addTrackToHistory(idString, track, artist);
        }
        this.updateAndEmit();
      }.bind(this));
    }.bind(this));

    this.app.get('/remove', function(req, res){
      var idString = req.query.idString;
      if(this.jukeboxManager.randomTrackIds[idString]){
        this.jukeboxManager.removeTracks([{uri: 'spotify:track:' + idString}], function(body){
          res.send({ response: body });
          this.updateAndEmit();
        }.bind(this));
      }
      else {
        res.send();
      }
    }.bind(this));

    this.app.get('/play', function(req, res){
      this.jukeboxManager.play();
      this.emitPlayState('playing');
      res.send();
    }.bind(this));

    this.app.get('/pause', function(req, res){
      this.jukeboxManager.pause();
      this.emitPlayState('paused');
      res.send();
    }.bind(this));

    this.app.get('/refresh', function(req, res){
      this.jukeboxManager.refresh(function(newToken) {
        console.log('after - ' + newToken);
      });
      res.send({});
    }.bind(this));
  };

  this.emitter.on('update playlist', function(data){
    this.io.emit('update playlist', data);
  }.bind(this))

  this.updateAndEmit = function() {
    this.jukeboxManager.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
      this.io.emit('update playlist', { currentlyPlaying: currentlyPlaying, playlistData: playlistData, playState: playState });
    }.bind(this));
  }

  this.emitPlayState = function(playState) {
    this.io.emit('update playstate', { playState: playState });
  }
}
