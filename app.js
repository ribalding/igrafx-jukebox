var express = require('express'); // Express web server framework
var app = express();
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config.json');
var client_id = config.client_id; 
var client_secret = config.client_secret; 
var playlist_id = config.playlist_id;
var redirect_uri = 'http://localhost:8888/callback'; 
var sql = require('mssql');
var SpotifyLayer = require('./backend/spotifylayer');
var Controller = require('./backend/controller');
var SpotifyManager = require('./backend/spotifymanager');
var DatabaseLayer = require('./backend/databaselayer');
var EventEmitter = require('events');

console.log('Listening on 8888');
http.listen(8888);

app.use(express.static(__dirname))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {
  var scope = 'user-read-private user-read-email user-read-currently-playing user-library-read playlist-modify-public playlist-modify-private playlist-modify user-modify-playback-state';
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

  request.post(authOptions, function(error, response, body){
    if (!error && response.statusCode === 200) {
      afterAuthentication(error, response, body);
    }
  });

  var afterAuthentication = function(error, response, body) {
    var access_token = body.access_token;
    var refresh_token = body.refresh_token;
    var spotifyLayer = new SpotifyLayer(access_token, refresh_token, client_id, client_secret, request);
    var emitter = new EventEmitter();
    var spotifyManager = new SpotifyManager(spotifyLayer, emitter, playlist_id);
    spotifyManager.init();
    var controller = new Controller(app, spotifyManager, io, emitter);
    controller.init();
    res.redirect('/');
    
  }
});
