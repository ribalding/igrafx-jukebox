var express = require('express'); // Express web server framework
var app = express();
var request = require('request-promise'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config.json');
var client_id = config.client_id; 
var client_secret = config.client_secret; 
var playlist_id = config.playlist_id;
var db_enabled = config.db_enabled || false;
var redirect_uri = 'http://localhost:8888/callback'; 
var sql = require('mssql');
var SpotifyAccessor = require('./backend/spotifyaccessor');
var Controller = require('./backend/controller');
var JukeboxManager = require('./backend/jukeboxmanager');
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
      if(db_enabled) {
        sql.connect(config.db_config).then(pool => {
          var databaseLayer = new DatabaseLayer(sql, pool);
          afterAuthentication(error, response, body, databaseLayer);
        });
      }
      else {
        afterAuthentication(error, response, body);
      }
    }
  });

  var afterAuthentication = function(error, response, body, databaseLayer) {
    var access_token = body.access_token;
    var refresh_token = body.refresh_token;
    var spotifyAccessor = new SpotifyAccessor(access_token, refresh_token, client_id, client_secret, request, playlist_id);
    var emitter = new EventEmitter();
    var jukeboxManager = new JukeboxManager(spotifyAccessor, emitter, playlist_id);
    jukeboxManager.init();
    var controller = new Controller(app, jukeboxManager, io, emitter, databaseLayer);
    controller.init();
    res.redirect('/');
    
  }
});
