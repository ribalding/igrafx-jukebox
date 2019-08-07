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
  var dataLayer;
  var trackListSection;

  var templates = {
      topArea: [
        '<div class="row">',
          '<div class="col-md-3 logoAndSearchSectionContainer">',
            '<div class="logoAndSearchSection">',
              '<h1 class="header">iGrafx Jukebox</h1>',
              '<input id="search" class="input-sm" type="text">',
              '<button id="searchButton" class="btn btn-primary">Search</button>',
            '</div>',
          '</div>',
          '{{#jukeboxIsPlaying}}',
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
          '{{/jukeboxIsPlaying}}',
          '{{^jukeboxIsPlaying}}',
            '<div class="col-md-8">',
              '<h3 class="notCurrentlyPlaying">The iGrafx Jukebox is Currently Not Playing</h3>',
            '</div>',
          '{{/jukeboxIsPlaying}}',
          '<div class="col-md-1">',
            '{{#jukeboxIsPlaying}}',
              '<h4 id="time"></h4>',
            '{{/jukeboxIsPlaying}}',
            '<button id="viewPlaylist" class="btn btn-default">View Playlist</button>',
          '</div>',
        '</div>',
      ].join('')
  }

  socket.on('update playlist', function(data){
    updatePlayDisplay(data);
  });

  var interval;

  function setTimeRemaining(response) {
    var current_ms = response.progress_ms;
    var duration_ms = response.item.duration_ms;
    $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));
    
    if (interval) {
      clearInterval(interval);
    }

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

  function updatePlayDisplay(data) {
    if(data) {
      currentlyPlaying = data.currentlyPlaying;
      playlistData = data.playlistData;
      updateTopSection(currentlyPlaying, playlistData);
      if(trackListSection.playlistIsVisible) {
        trackListSection.displayPlaylist(playlistData);
      }
    }
    else {
      dataLayer.getJukeboxData(function(response) {
        currentlyPlaying = response.currentlyPlaying;
        playlistData = response.playlistData;
        updateTopSection(currentlyPlaying, playlistData);
        if(trackListSection.playlistIsVisible) {
          trackListSection.displayPlaylist(playlistData);
        }
      });
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
  function updateTopSection(currentlyPlaying, playlistData) {
    var playlistUrl = 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1';
    var jukeboxIsPlaying = currentlyPlaying.context && currentlyPlaying.is_playing && currentlyPlaying.context.href === playlistUrl;
    var topSection = Mustache.render(templates.topArea, {
      jukeboxIsPlaying: jukeboxIsPlaying,
      currentlyPlayingImage: currentlyPlaying.item.album.images[1].url,
      currentlyPlayingSong: currentlyPlaying.item.name,
      currentlyPlayingArtist: currentlyPlaying.item.artists[0].name
    });

    $('#topSection').html(topSection);
    if(jukeboxIsPlaying) {
      setTimeRemaining(currentlyPlaying);
      getNextTrack(playlistData.items, currentlyPlaying.item.id);
    }
    registerButtonListeners();
  };


  function registerButtonListeners() {
    $('#searchButton').off();
    $('#viewPlaylist').off();
    $('#search').off();
    $('#searchButton').on('click', function() {
      var searchString = $('#search').val().trim();
      search(searchString);
    });

    $('#viewPlaylist').on('click', function(){
      if(playlistData.items && playlistData.items.length && !trackListSection.playlistIsVisible) {
        trackListSection.displayPlaylist(playlistData);
      }
    });

    $('#search').on('keydown', function(e){
      if(e.which === 13) {
        $('#searchButton').trigger('click');
      }
    });
  }

  $(document).ready(function() {
    dataLayer = new DataLayer();
    trackListSection = new TrackListSection(dataLayer);
    updatePlayDisplay();
  });

});
