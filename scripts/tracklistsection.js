define(['jquery', 'mustache', 'datalayer', 'util'], function($, Mustache, DataLayer, Util){

  var templates = {
    trackList: [
      '<div class="row itemRow">',
        '<div class="col-md-2"></div>',
        '<div class="col-md-3">',
          '<b>Artist</b>',
        '</div>',
        '<div class="col-md-6">',
          '<b>Title</b>',
        '</div>',
        '<div class="col-md-1"></div>',
      '</div>',
      '{{#tracks}}',
        '{{>track}}',
      '{{/tracks}}'
    ].join(''),

    track: [
      '<div class="row itemRow" data-track-id="{{trackId}}">',
        '<div class="col-md-2">',
          '{{#albumArtUrl}}',
            '<img class="playlistImage" src="{{albumArtUrl}}">',
          '{{/albumArtUrl}}',
        '</div>',
        '<div class="col-md-3">',
          '<p class="artistName">{{artistName}}</p>',
        '</div>',
        '<div class="col-md-5">',
          '<p class="trackName">{{trackName}}</p>',
        '</div>',
          '<div class="col-md-1">',
            '{{trackLength}}',
          '</div>',
        '<div class="col-md-1">',
          '{{#searchResults}}',
            '<button class="btn btn-success addToPlaylist">+</button>',
          '{{/searchResults}}',
          '{{^searchResults}}',
            '{{#isRandom}}',
              '<button class="btn btn-danger removeFromPlaylist" title="Automatically added tracks can be removed">X</button>',
            '{{/isRandom}}',
          '{{/searchResults}}',
        '</div>',
      '</div>',
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
      var self = this;
      var playlistHtml = Mustache.render(templates.trackList, {
        tracks: this.mapTrackListData(playlistData.items)
      }, templates);
      this.$trackListSection.html(playlistHtml).show();
      $('.removeFromPlaylist').off('click');
      $('.removeFromPlaylist').on('click', function() {
        var $button = $(this);
        var $row = $button.closest('.itemRow');
        var trackId = $row.attr('data-track-id');
        self.dataLayer.removeFromPlaylist(trackId, function(response){
          $button.replaceWith('<b><span class="text-danger">Removing...</span></b>');
        });
      });
    },

    displaySearchResults: function(response) {
      var self = this;
      $('.addToPlaylist').off('click'); // Get rid of any leftover handlers from previous searches
      var tracks = response.response.tracks;
      if (tracks) {
        var items = tracks.items;
        var searchResultsHtml = Mustache.render(templates.trackList, {
          tracks: this.mapTrackListData(items),
          searchResults: true
        }, templates);
        this.$trackListSection.html(searchResultsHtml).show();
        this.playlistIsVisible = false;
        $('.addToPlaylist').on('click', function() {
          var $button = $(this);
          var $row = $button.closest('.itemRow');
          var trackId = $row.attr('data-track-id');
          var artist = $row.find('.artistName').text();
          var track = $row.find('.trackName').text();
          self.dataLayer.addToPlaylist(trackId, artist, track, function(){
            $button.replaceWith('<b><span class="text-success">Added</span></b>');
          });
        });
      }
    },


    mapTrackListData: function(items) {
      return items.map(function(item, index){
        if(item.track) {
          item = item.track;
        }
        var thumbnail = item.album.images[1];
        return {
          trackId: item.id,
          albumArtUrl: !!thumbnail ? thumbnail.url : null,
          artistName: item.artists[0].name,
          trackName: item.name,
          trackLength: Util.millisToMinutesAndSeconds(item.duration_ms),
          isRandom: item.isRandom && index !== 0
        }
      });
    }
  };

  return TrackListSection;
});
