define([
  'jquery',
  'mustache',
  'datalayer',
  'tracklistsection',
  'util',
  'socketio'
], function (
  $,
  Mustache,
  DataLayer,
  TrackListSection,
  Util,
  io)
{

  var socket = io();
  var playlistData;
  var currentlyPlaying;
  var playState;
  var dataLayer;
  var trackListSection;

  var templates = {
    topArea: [
      '<div class="row">',
        '<div class="col-md-3 logoAndSearchSectionContainer">',
          '<div class="logoAndSearchSection">',
            '<h1 class="header">iGrafx Jukebox</h1>',
            '<input id="search" class="input-sm" type="text"> ',
            '<button id="searchButton" class="btn btn-primary"><span class="glyphicon glyphicon-search"></span></button>',
          '</div>',
        '</div>',
        '{{^isStopped}}',
          '<div class="col-md-2 currentlyPlayingImageContainer">',
            '<img id="currentlyPlayingImage" src="{{currentlyPlayingImage}}">',
          '</div>',
          '<div class="col-md-6 currentlyPlayingContainer">',
            '<h2 class="currentlyPlaying">',
              '<div id="currentlyPlayingSong">{{currentlyPlayingSong}}</div>',
            '</h2>',
            '<h3 id="currentlyPlayingArtist" class="currentlyPlaying">{{currentlyPlayingArtist}}</h3>',
            '<h4 class="nextUp">Next Up: "<span id="nextUpSong"></span>" by <span id="nextUpArtist"></span></h4>',
          '</div>',
        '{{/isStopped}}',
        '{{#isStopped}}',
          '<div class="col-md-8">',
            '<h3 class="notCurrentlyPlaying">The iGrafx Jukebox is Currently Not Playing</h3>',
          '</div>',
        '{{/isStopped}}',
        '<div class="col-md-1">',
          '{{^isStopped}}',
            '<h4 id="time"></h4>',
            '<img class="playPauseIcon" src="../res/images/{{#isPaused}}play.png{{/isPaused}}{{#isPlaying}}pause.png{{/isPlaying}}">',
          '{{/isStopped}}',
          '<button id="viewPlaylist" class="btn btn-default">View Playlist</button>',
        '</div>',
      '</div>',
    ].join('')
  }

  socket.on('update playlist', function(data){
    update(data.currentlyPlaying, data.playlistData, data.playState);
  });

  socket.on('update playstate', function(data){
    update(currentlyPlaying, playlistData, data.playState);
  });

  var interval;

  function setTimeRemaining(response, playState) {
    var current_ms = response.progress_ms;
    var duration_ms = response.item.duration_ms;
    $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));

    if (interval) {
      clearInterval(interval);
    }
    if(playState === 'playing') {
      interval = setInterval(function() {
        current_ms += 1000;
        if (current_ms <= response.item.duration_ms) {
          $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));
        }
        else {
          clearInterval(interval);
        }
      }, 1000);
    }
  }

  function getPlaylistDataAndUpdate() {
    dataLayer.getJukeboxData(function(response) {
      update(response.currentlyPlaying, response.playlistData, response.playState);
    });
  }

  function update(cp, pd, ps) {
    currentlyPlaying = cp;
    playlistData = pd;
    playState = ps;
    updateTopSection(currentlyPlaying, playlistData, playState);
    if(trackListSection.playlistIsVisible) {
      trackListSection.displayPlaylist(playlistData, currentlyPlaying.item.id);
    }
  }

  function search(searchString) {
    dataLayer.search(searchString, function(response) {
      trackListSection.displaySearchResults(response);
    });
  }

  function getNextTrack(items, currentTrackId) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.track.id === currentTrackId) {
        var nextUp = items[i + 1];
        if (nextUp) {
          $('#nextUpSong').html(nextUp.track.name);
          $('#nextUpArtist').html(nextUp.track.artists[0].name);
          $('.nextUp').show();
        }
        break;
      }
    };
  }
  function updateTopSection(currentlyPlaying, playlistData, playState, initialRender) {
    var currentlyPlayingTrack = currentlyPlaying.item;
    var topSection = Mustache.render(templates.topArea, {
      isPlaying: playState === 'playing',
      isPaused: playState === 'paused',
      isStopped: playState === 'stopped',
      currentlyPlayingImage: currentlyPlayingTrack.album && currentlyPlayingTrack.album.images[1].url,
      currentlyPlayingSong: currentlyPlayingTrack.name,
      currentlyPlayingArtist: currentlyPlayingTrack.artists[0].name,
      initialRender: initialRender
    });

    $('#topSection').html(topSection);
    if(playState !== 'stopped') {
      setTimeRemaining(currentlyPlaying, playState);
      getNextTrack(playlistData.items, currentlyPlaying.item.id);
    }
    registerButtonListeners();
  };


  function registerButtonListeners() {
    $('#searchButton').off();
    $('#viewPlaylist').off();
    $('#search').off();
    $('.playPauseIcon').off();
    $('#searchButton').on('click', function() {
      var searchString = $('#search').val().trim();
      search(searchString);
    });

    $('#viewPlaylist').on('click', function(){
      trackListSection.playlistIsVisible = true;
      getPlaylistDataAndUpdate();
    });

    $('#search').on('keydown', function(e){
      if(e.which === 13) {
        $('#searchButton').trigger('click');
      }
    });

    $('.playPauseIcon').on('click', function(e){
      if(playState === 'playing') {
        dataLayer.pause(function(response){
          console.log(response);
        });
      }
      else {
        dataLayer.play(function(response){
          console.log(response);
        });
      }
    })
  }

  $(document).ready(function() {
    dataLayer = new DataLayer();
    trackListSection = new TrackListSection(dataLayer);
    getPlaylistDataAndUpdate();
  });

});
