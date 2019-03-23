define(['jquery', 'mustache', 'datalayer', 'util'], function($, Mustache, DataLayer, Util){

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

  function TrackListSection(dataLayer) {
    this.playlistIsVisible = false;
    this.$trackListSection = $('#searchResultSection');
    this.dataLayer = dataLayer;
  }

  TrackListSection.prototype = {
    displayPlaylist: function(playlistData) {
      this.playlistIsVisible = true;
      var searchResultsHtml = Mustache.render(templates.trackList, {
        tracks: this.mapTrackListData(playlistData.items)
      });
      this.$trackListSection.html(searchResultsHtml).show();
    },

    displaySearchResults: function(response) {
      var self = this;
      $('.addToPlaylist').off('click'); // Get rid of any leftover handlers from previous searches
      var tracks = response.response.tracks;
      if (tracks) {
        var items = response.response.tracks.items;
        var searchResultsHtml = Mustache.render(templates.trackList, {
          tracks: this.mapTrackListData(items),
          searchResults: true
        });
        this.$trackListSection.html(searchResultsHtml).show();
        this.playlistIsVisible = false;
        $('.addToPlaylist').on('click', function() {
          var $button = $(this);
          var trackId = $button.closest('.itemRow').attr('data-track-id');
          var idString = 'spotify:track:' + trackId;
          self.dataLayer.addToPlaylist(idString, function(){
            $button.replaceWith('<b><span class="text-success">Added</span></b>');
          });
        });
      }
    },

    mapTrackListData: function(items) {
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
          trackLength: Util.millisToMinutesAndSeconds(item.duration_ms)
        }
      });
    }
  };

  return TrackListSection;
});
