define(['jquery', 'mustache', 'datalayer', 'tracklistsection', 'util'], function($, Mustache, DataLayer, TrackListSection, Util){

  var playlistData;
  var playlistIsVisible = false;
  var currentlyPlaying;
  var dataLayer;
  var trackListSection;

  function setTimeRemaining(response) {
    var current_ms = response.progress_ms;
    var duration_ms = response.item.duration_ms;
    $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));
    var x = setInterval(function() {
      current_ms += 1000;
      if (current_ms <= response.item.duration_ms) {
        $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));
      }
      else {
        clearInterval(x);
        updatePlayDisplay();
      }
    }, 1000);
  }

  function updatePlayDisplay(isFirst) {
    dataLayer.getJukeboxData(function(response) {
      currentlyPlaying = response.currentlyPlaying;
      playlistData = response.playlistData;
      updateTopSection(currentlyPlaying, playlistData)
      if(isFirst) {
        $('#topSection').show();
      }
      if(playlistIsVisible) {
        showPlaylist();
      }
    });
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
  function updateTopSection(currentlyPlaying, playlistData, isFirst) {
    var playlistUrl = 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1';
    if (currentlyPlaying.context && currentlyPlaying.is_playing && currentlyPlaying.context.href === playlistUrl) {
      $('#currentlyPlayingSong').html(currentlyPlaying.item.name);
      $('#currentlyPlayingArtist').html(currentlyPlaying.item.artists[0].name);
      $('.currentlyPlaying').show();
      setTimeRemaining(currentlyPlaying);
      getNextTrack(playlistData.items, currentlyPlaying.item.id);
    }
    else {
      $('.currentlyPlaying').hide();
      $('.notCurrentlyPlaying').show();
    }
    registerButtonListeners();
  };


  function registerButtonListeners() {
    $('#searchButton').on('click', function() {
      var searchString = $('#search').val().trim();
      search(searchString);
    });

    $('#viewPlaylist').on('click', function(){
      if(playlistData.items && playlistData.items.length) {
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
    updatePlayDisplay(true);
  })

});
