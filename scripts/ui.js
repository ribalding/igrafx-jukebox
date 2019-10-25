define([
  'jquery',
  'mustache',
  'datalayer',
  'tracklistsection',
  'util',
  'socketio', 
  'navbar'
], function (
  $,
  Mustache,
  DataLayer,
  TrackListSection,
  Util,
  io,
  Navbar)
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
          '</div>',
          '<div id="navbarSection"></div>',
        '</div>',
        '{{^isStopped}}',
          '<div class="col-md-2 currentlyPlayingImageContainer">',
            '<img id="currentlyPlayingImage" src="{{currentlyPlayingImage}}">',
            '<input type="color" id="colorSelect">',
          '</div>',
          '<div class="col-md-6 currentlyPlayingContainer">',
            '<h2 class="currentlyPlaying">',
              '<div id="currentlyPlayingSong">{{currentlyPlayingSong}}</div>',
            '</h2>',
            '<h3 id="currentlyPlayingArtist" class="currentlyPlaying">{{currentlyPlayingArtist}}</h3>',
            '<h4 id="time"></h4>',
            '{{^isStopped}}',
              '<img class="playPauseIcon" src="../res/images/{{#isPaused}}play.png{{/isPaused}}{{#isPlaying}}pause.png{{/isPlaying}}">',
            '{{/isStopped}}',
          '</div>',
        '{{/isStopped}}',
        '{{#isStopped}}',
          '<div class="col-md-8">',
            '<h3 class="notCurrentlyPlaying">The iGrafx Jukebox is Currently Not Playing</h3>',
          '</div>',
        '{{/isStopped}}',
        '<div class="col-md-1">',
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
    
    new Navbar($('#navbarSection'), function(playlistTabClicked) {
      trackListSection.updateTracklistSection(playlistTabClicked);
    }.bind(this));
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
    }
    registerButtonListeners();
  };


  function registerButtonListeners() {
    $('#viewPlaylist').off();
    $('.playPauseIcon').off();
    $(document).off('dragenter dragover drop');
   
    $('#viewPlaylist').on('click', function(){
      trackListSection.playlistIsVisible = true;
      getPlaylistDataAndUpdate();
    });

    $('.playPauseIcon').on('click', function(e){
      playState === 'playing' ? dataLayer.pause() :dataLayer.play();
    });

    $(document).on('dragover dragenter', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    $(document).on('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var url = e.originalEvent.dataTransfer.getData('text/plain');
      var pathArray = url.split('/');
      var idString = pathArray[pathArray.length - 1];
      if(idString) {
        dataLayer.addToPlaylist(idString, null, null);
      }
    });

    $('#colorSelect').on('change', function(e){
      var newColor = $(e.target).val();
      $('body').css('background-color', newColor);
    });
  }

  $(document).ready(function() {
    dataLayer = new DataLayer();
    trackListSection = new TrackListSection(dataLayer);
    getPlaylistDataAndUpdate();
  });

});
