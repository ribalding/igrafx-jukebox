(function() {
  function setTimeRemaining(response) {
    var current_ms = response.progress_ms;
    $('#time').html(millisToMinutesAndSeconds(current_ms) + ' / ' + millisToMinutesAndSeconds(response.item.duration_ms));
    var x = setInterval(function() {
      current_ms += 1000;
      if (current_ms <= response.item.duration_ms) {
        $('#time').html(millisToMinutesAndSeconds(current_ms) + ' / ' + millisToMinutesAndSeconds(response.item.duration_ms));
      } else {
        clearInterval(x);
        updatePlayDisplay();
      }
    }, 1000);
  }

  var templates = {
    searchResults: [
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
            '<button class="btn btn-success addToPlaylist">+</button>',
          '</div>',
        '</div>',
      '{{/tracks}}'
    ].join('')
  };

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
    var currentlyPlaying = response.currentlyPlaying;
    var playlistData = response.playlistData;
    if(isFirst) {
      $('#topSection').effect('slide', {}, 1000, function() {
        updateTopSection(currentlyPlaying, playlistData)
      });
    }
    else {
      updateTopSection(currentlyPlaying, playlistData);
    }
  }

  function updateTopSection(currentlyPlaying, playlistData, isFirst) {
    if (currentlyPlaying.context && currentlyPlaying.context.href === 'https://api.spotify.com/v1/playlists/3KtyHb6OPldYjyU4yzngi1') {
      $('#currentlyPlayingSong').html(currentlyPlaying.item.name);
      $('#currentlyPlayingArtist').html(currentlyPlaying.item.artists[0].name);
      if(isFirst) {
        $('.currentlyPlaying').fadeIn();
      }
      else {
        $('.currentlyPlaying').show();
      }
      setTimeRemaining(currentlyPlaying);
      getNextTrack(playlistData.items, currentlyPlaying.item.id);
    } else {
      if(isFirst){
        $('.notCurrentlyPlaying').fadeIn();
      }
      else {
        $('.currentlyPlaying').hide();
        $('.notCurrentlyPlaying').show();
      }
    }
    $('#searchButton').on('click', function() {
      var searchString = $('#search').val().trim();
      search(searchString);
    });
  }

  function mapSearchResultsData(items) {
    return items.map(function(item){
      return {
        trackId: item.id,
        albumArtUrl: !!item.album.images[2] ? item.album.images[2].url : null,
        artistName: item.artists[0].name,
        trackName: item.name
      }
    });
  }

  function onReceiveSearchResults(response) {
    var items = response.response.tracks.items;
    var $resultSection = $('#searchResultSection');
    var searchResultsHtml = Mustache.render(templates.searchResults, {
      tracks: mapSearchResultsData(items)
    });
    $resultSection.html(searchResultsHtml).show();
    $('.addToPlaylist').on('click', function() {
      var trackId = $(this).closest('.itemRow').attr('data-track-id');
      var idString = 'spotify:track:' + trackId;
      addToPlaylist(idString, $(this));
    });
  }

  $(document).ready(function() {
      updatePlayDisplay(true);
      $('#search').on('keydown', function(e){
        if(e.which === 13) {
          $('#searchButton').trigger('click');
        }
      });
  })
})();
