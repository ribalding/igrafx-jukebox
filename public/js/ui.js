(function() {
  var templates = {
    trackList: [
      '<div class="row itemRow">',
        '<div class="col-md-1"></div>',
        '<div class="col-md-3">',
          '<b>Artist</b>',
        '</div>',
        '<div class="col-md-7">',
          '<b>Title</b>',
        '</div>',
        '<div class="col-md-1"></div>',
      '</div>',
      '{{#tracks}}',
        '<div class="row itemRow" data-track-id="{{trackId}}">',
          '<div class="col-md-1">',
            '{{#albumArtUrl}}',
              '<img src="{{albumArtUrl}}">',
            '{{/albumArtUrl}}',
          '</div>',
          '<div class="col-md-3">',
            '<p>{{artistName}}</p>',
          '</div>',
          '<div class="col-md-7">',
            '<p>{{trackName}}</p>',
          '</div>',
          '<div class="col-md-1">',
            '{{#searchResults}}',
              '<button class="btn btn-success addToPlaylist">+</button>',
            '{{/searchResults}}',
            '{{^searchResults}}',
              '{{trackLength}}',
            '{{/searchResults}}',
          '</div>',
        '</div>',
      '{{/tracks}}'
    ].join('')
  };

  var playlistData;
  var playlistIsVisible = false;
  var currentlyPlaying;

  function setTimeRemaining(response) {
    var current_ms = response.progress_ms;
    var duration_ms = response.item.duration_ms;
    $('#time').html(millisToMinutesAndSeconds(current_ms) + ' / ' + millisToMinutesAndSeconds(duration_ms));
    var x = setInterval(function() {
      current_ms += 1000;
      if (current_ms <= response.item.duration_ms) {
        $('#time').html(millisToMinutesAndSeconds(current_ms) + ' / ' + millisToMinutesAndSeconds(duration_ms));
      } else {
        clearInterval(x);
        updatePlayDisplay();
      }
    }, 1000);
  }

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return (seconds == 60 ? (minutes + 1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
  }

  function updatePlayDisplay(fadeIn) {
    $.get('/jukebox', function(response) {
      onReceiveCurrentlyPlaying(response, fadeIn);
    });
  }

  function search(searchString) {
    $.ajax({
      url: '/search',
      data: {
        searchString: searchString
      }
    }).done(function(response) {
      onReceiveSearchResults(response);
    });
  }

  function addToPlaylist(idString, $button) {
    $.ajax({
      url: '/add',
      data: {
        idString: idString
      }
    }).done(function(response) {
      $button.replaceWith('<b><span class="text-success">Added</span></b>');
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
          $('.nextUp').fadeIn();
        }
        break;
      }
    };
  }

  function onReceiveCurrentlyPlaying(response, isFirst) {
    currentlyPlaying = response.currentlyPlaying;
    playlistData = response.playlistData;
    updateTopSection(currentlyPlaying, playlistData)
    if(isFirst) {
      $('#topSection').effect('slide', {}, 1000);
    }
    if(playlistIsVisible) {
      showPlaylist();
    }
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
        showPlaylist();
      }
    });

    $('#search').on('keydown', function(e){
      if(e.which === 13) {
        $('#searchButton').trigger('click');
      }
    });
  }

  function cleanPlaylistData() {
    for(var i=0; i < playlistData.items.length; i++) {
      var item = playlistData.items[i];
      if(item.id === currentlyPlaying.id) {
        break;
      }
      else {
        playlistData.items.splice(i, 1);
      }
    }
  }

  function showPlaylist() {
    cleanPlaylistData();
    playlistIsVisible = true;
    var $resultSection = $('#searchResultSection');
    var searchResultsHtml = Mustache.render(templates.trackList, {
      tracks: mapTrackListData(playlistData.items)
    });
    $resultSection.html(searchResultsHtml).show();
  }

  function mapTrackListData(items) {
    return items.map(function(item){
      if(item.track) {
        item = item.track;
      }
      var thumbnail = item.album.images[2];
      return {
        trackId: item.id,
        albumArtUrl: !!thumbnail ? thumbnail.url : null,
        artistName: item.artists[0].name,
        trackName: item.name,
        trackLength: millisToMinutesAndSeconds(item.duration_ms)
      }
    });
  }

  function onReceiveSearchResults(response) {
    var tracks = response.response.tracks;
    if(tracks) {
      var items = response.response.tracks.items;
      var $resultSection = $('#searchResultSection');
      var searchResultsHtml = Mustache.render(templates.trackList, {
        tracks: mapTrackListData(items),
        searchResults: true
      });
      $resultSection.html(searchResultsHtml).show();
      playlistIsVisible = false;
      $('.addToPlaylist').on('click', function() {
        var trackId = $(this).closest('.itemRow').attr('data-track-id');
        var idString = 'spotify:track:' + trackId;
        addToPlaylist(idString, $(this));
      });
    }
  }

  $(document).ready(function() {
    updatePlayDisplay(true);
  })
})();
