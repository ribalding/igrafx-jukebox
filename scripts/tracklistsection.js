define(['jquery', 'mustache', 'datalayer', 'util'], function ($, Mustache, DataLayer, Util) {
   /* 
   This is for after bootstrap gets updated
   <div class="input-group mb-3">
      <input type="text" class="form-control" placeholder="Recipient's username" aria-label="Recipient's username" aria-describedby="basic-addon2">
      <div class="input-group-append">
         <span class="input-group-text" id="basic-addon2">@example.com</span>
      </div>
   </div> 
   */
   var templates = {
      searchBar: [
         '<div class="searchBar itemRow">',
            '<input id="search" aria-describedby="#searchButton" type="text" {{#searchString}}value="{{searchString}}"{{/searchString}}> ',
            // '<select id="searchBy">',
            //    '<option value="all">All</option>',
            //    '<option value="artist">Artist</option>',
            //    '<option value="track">Track</option>',
            //    '<option value="album">Album</option>',
            // '</select>',
            '<button id="searchButton" class="btn btn-outline-secondary" type="button">',
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
         '{{#tracks.length}}',
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
         '{{/tracks.length}}',
         '{{#tracks}}',
            '{{>track}}',
         '{{/tracks}}',
         // '{{#searchResults}}',
         //    '{{#tracks.length}}',
         //       '<button type="button" class="btn btn-primary btn-lg btn-block loadMore">Load More</button>',
         //    '{{/tracks.length}}',
         // '{{/searchResults}}',   
         '{{^tracks}}',
            '<div class="noSearchResults">No Results To Display</div>',
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
      this.searchBy = 'all';
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
            this.playlistData.items.shift(); // Extra catch in case the first song is an already removed track (due to async).  It's gross but oh well.
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
            self.dataLayer.removeFromPlaylist(trackId, function(response) {
               $button.replaceWith('<strong><span class="text-danger">Removing...</span></strong>');
            });
         });
      },

      displaySearchSection: function () {
         this.playlistIsVisible = false;
         var previousSearchResults = this.previousSearchResults || [];
         var searchSectionHtml = Mustache.render(templates.trackListWrapper, {
            tracks: previousSearchResults,
            searchResults: true,
            searchString: this.previousSearchString,
         }, templates);
         this.$trackListSection.html(searchSectionHtml);
         this.assignSearchSectionHandlers();
      },

      displaySearchResults: function (response) {
         var tracks = response.response.tracks;
         if (tracks) {
            var items = tracks.items;
            var searchResultData = this.mapTrackListData(items);
            this.previousSearchResults = searchResultData;
            var searchResultsHtml = Mustache.render(templates.trackList, {
               tracks: searchResultData,
               searchResults: true
            }, templates);
            this.$trackListSection.find('.tracklist').html(searchResultsHtml).show();
            this.playlistIsVisible = false;
            this.assignSearchSectionHandlers();
         }
      },

      assignSearchSectionHandlers: function(){
         $('#searchButton').off();
         $('#search').off();
         $('#searchBy').off();
         $('#searchButton').on('click', function () {
            var searchString = $('#search').val().trim();
            this.search(searchString, this.searchBy);
            this.previousSearchString = searchString;
         }.bind(this));

         $('#search').on('keydown', function (e) {
            if (e.which === 13) {
               $('#searchButton').trigger('click');
            }
         });

         $('#searchBy').on('change', function(selection){
            var newSearchBy = $(selection.target).val();
            this.searchBy = newSearchBy;
         }.bind(this));

         var self = this;
         $('.addToPlaylist').off('click'); // Get rid of any leftover handlers from previous searches
         $('.addToPlaylist').on('click', function () {
            var $button = $(this);
            var $row = $button.closest('.itemRow');
            var trackId = $row.attr('data-track-id');
            var artist = $row.find('.artistName').text();
            var track = $row.find('.trackName').text();
            self.dataLayer.addToPlaylist(trackId, artist, track, function () {
               self
               $button.replaceWith('<b><span class="text-success">Added</span></b>');
            });
         });
      },

      search: function (searchString, searchBy) {
         this.dataLayer.search(searchString, searchBy, function (response) {
            this.displaySearchResults(response);
         }.bind(this));
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
