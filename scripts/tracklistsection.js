define(['jquery', 'mustache', 'datalayer', 'util'], function ($, Mustache, DataLayer, Util) {

   var templates = {
      searchBar: [
         '<div class="searchBar itemRow">',
            '<input id="search" class="input-sm" type="text"> ',
            '<button id="searchButton" class="btn btn-primary">',
               '<span class="glyphicon glyphicon-search"></span>',
            '</button>',
         '</div>'
      ].join(''),

      trackListWrapper: [
         '{{#searchResults}}',
            '{{>searchBar}}',
         '{{/searchResults}}',
         '<div class="tracklist">',
            '{{>trackList}}',
         '</div>'
      ].join(''),

      trackList: [
         '<div class="row itemRow">',
            '<div class="col-md-2"></div>',
            '<div class="col-md-3">',
               '<strong>Artist</strong>',
            '</div>',
            '<div class="col-md-6">',
               '<strong>Title</strong>',
            '</div>',
            '<div class="col-md-1"></div>',
         '</div>',
         '{{#tracks}}',
            '{{>track}}',
         '{{/tracks}}',
         '{{^tracks}}',
            '<strong>No Results To Display</strong>',
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
               '<span class="artistName">{{artistName}}</span>',
            '</div>',
            '<div class="col-md-5">',
               '<span class="trackName">{{trackName}}</span>',
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
      ].join(''),
   };

   function TrackListSection(playlistData, currentlyPlayingId, dataLayer) {
      this.playlistData = playlistData;
      this.currentlyPlayingId = currentlyPlayingId;
      this.playlistIsVisible = true;
      this.$trackListSection = $('#trackListSection');
      this.dataLayer = dataLayer;
      this.displayPlaylist();
   }

   TrackListSection.prototype = {
      toggle: function (displayPlaylist) {
         if (displayPlaylist && !this.playlistIsVisible) {
            this.displayPlaylist()
         }
         else if(!displayPlaylist && this.playlistIsVisible) {
            this.displaySearchSection();
         }
      },

      updatePlaylistData: function(playlistData, currentlyPlayingId) {
         this.playlistData = playlistData;
         this.currentlyPlayingId = currentlyPlayingId;
         if(this.playlistIsVisible) {
            this.displayPlaylist();
         }
      },

      displayPlaylist: function () {
         if (this.currentlyPlayingId !== this.playlistData.items[0].track.id) {
            this.playlistData.items.shift(); // Extra catch in case the first song is an already removed track.  It's gross but oh well.
         }
         this.playlistIsVisible = true;
         var self = this;
         var playlistHtml = Mustache.render(templates.trackList, {
            tracks: this.mapTrackListData(this.playlistData.items)
         }, templates);
         this.$trackListSection.html(playlistHtml).show();
         $('.removeFromPlaylist').off('click');
         $('.removeFromPlaylist').on('click', function () {
            var $button = $(this);
            var $row = $button.closest('.itemRow');
            var trackId = $row.attr('data-track-id');
            self.dataLayer.removeFromPlaylist(trackId, function (response) {
               $button.replaceWith('<strong><span class="text-danger">Removing...</span></strong>');
            });
         });
      },

      displaySearchSection: function () {
         var previousSearchResults = this.previousSearchResults || [];
         var searchSectionHtml = Mustache.render(templates.trackListWrapper, {
            tracks: previousSearchResults,
            searchResults: true
         }, templates);
         this.$trackListSection.html(searchSectionHtml);
         this.assignSearchSectionHandlers();
      },

      displaySearchResults: function (response) {
         var self = this;
         var tracks = response.response.tracks;
         $('.addToPlaylist').off('click'); // Get rid of any leftover handlers from previous searches
         if (tracks) {
            var items = tracks.items;
            var searchResultsHtml = Mustache.render(templates.trackList, {
               tracks: this.mapTrackListData(items),
               searchResults: true
            }, templates);
            this.$trackListSection.html(searchResultsHtml).show();
            this.playlistIsVisible = false;
            $('.addToPlaylist').on('click', function () {
               var $button = $(this);
               var $row = $button.closest('.itemRow');
               var trackId = $row.attr('data-track-id');
               var artist = $row.find('.artistName').text();
               var track = $row.find('.trackName').text();
               self.dataLayer.addToPlaylist(trackId, artist, track, function () {
                  $button.replaceWith('<b><span class="text-success">Added</span></b>');
               });
            });
         }
      },

      assignSearchSectionHandlers: function(){
         $('#searchButton').off();
         $('#search').off();
         $('#searchButton').on('click', function () {
            var searchString = $('#search').val().trim();
            search(searchString);
         });

         $('#search').on('keydown', function (e) {
            if (e.which === 13) {
               $('#searchButton').trigger('click');
            }
         });
      },

      search: function (searchString) {
         dataLayer.search(searchString, function (response) {
            trackListSection.displaySearchResults(response);
         });
      },

      mapTrackListData: function (items) {
         return items.map(function (item, index) {
            if (item.track) {
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
