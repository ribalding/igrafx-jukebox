define(['jquery', 'mustache', 'datalayer', 'util'], function ($, Mustache, DataLayer, Util) {
   var templates = {
      topSectionFrame: [
         '<div class="row">',
            '<div class="col-md-3 logoAndSearchSectionContainer">',
               '<div class="logoAndSearchSection">',
                  '<h1 class="header">iGrafx Jukebox</h1>',
               '</div>',
               '<div id="navbarSection"></div>',
            '</div>',
               '<div id="currentlyPlayingSection">',
                  '{{>topSectionCurrentlyPlaying}}',
            '</div>',
         '</div>',
      ].join(''),

      topSectionCurrentlyPlaying: [
            '{{^isStopped}}',
               '<div class="col-md-2 currentlyPlayingImageContainer">',
                  '<img id="currentlyPlayingImage" src="{{currentlyPlayingImage}}">',
                  '<input type="color" id="colorSelect" value="{{themeColor}}">',
               '</div>',
               '<div class="col-md-6 currentlyPlayingContainer">',
                  '<h2 class="currentlyPlaying">',
                     '<div id="currentlyPlayingSong">{{currentlyPlayingSong}}</div>',
                  '</h2>',
                  '<h3 id="currentlyPlayingArtist" class="currentlyPlaying">{{currentlyPlayingArtist}}</h3>',
                  '<h4 id="time"></h4>',
                  '<img class="playPauseIcon" src="../res/images/{{#isPaused}}play.png{{/isPaused}}{{#isPlaying}}pause.png{{/isPlaying}}">',
               '</div>',
            '{{/isStopped}}',
            '{{#isStopped}}',
               '<div class="col-md-9">',
                  '<h3 class="notCurrentlyPlaying">The iGrafx Jukebox is Currently Not Playing</h3>',
               '</div>',
            '{{/isStopped}}',
      ].join('')
   }

   function TopSection(currentlyPlaying, playlistData, playState, dataLayer, themeColor) {
      this.currentlyPlaying = currentlyPlaying;
      this.playlistData = playlistData;
      this.playState = playState;
      this.dataLayer = dataLayer;
      this.themeColor = themeColor;
      this._render(true);
   }

   TopSection.prototype = {
      _render: function (initialRender) {
         var currentlyPlayingTrack = this.currentlyPlaying.item;
         var playState = this.playState;
         var data = {
            isPlaying: playState === 'playing',
            isPaused: playState === 'paused',
            isStopped: playState === 'stopped',
            currentlyPlayingImage: currentlyPlayingTrack.album && currentlyPlayingTrack.album.images[1].url,
            currentlyPlayingSong: currentlyPlayingTrack.name,
            currentlyPlayingArtist: currentlyPlayingTrack.artists[0].name,
            themeColor: this.themeColor
         }
         if(initialRender) {
            var topSection = Mustache.render(templates.topSectionFrame, data, templates);
            $('#topSection').html(topSection).show();;
         }
         else {
            var currentlyPlayingSection = Mustache.render(templates.topSectionCurrentlyPlaying, data);
            $('#currentlyPlayingSection').html(currentlyPlayingSection);
         }
         if (this.playState !== 'stopped') {
            this._setTimeRemaining(this.currentlyPlaying, this.playState);
         }
         this._registerButtonListeners();
      },

      update: function(currentlyPlaying, playlistData, playState) {
         this.currentlyPlaying = currentlyPlaying;
         this.playlistData = playlistData;
         this.playState = playState;
         this._render();
      },

      _registerButtonListeners: function () {
         $('.playPauseIcon').off();
         $(document).off('dragenter dragover drop');

         $('.playPauseIcon').on('click', function (e) {
            this.playState === 'playing' ? this.dataLayer.pause() : this.dataLayer.play();
         }.bind(this));

         $(document).on('dragover dragenter', function (e) {
            e.preventDefault();
            e.stopPropagation();
         });

         $(document).on('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var url = e.originalEvent.dataTransfer.getData('text/plain');
            var pathArray = url.split('/');
            var idString = pathArray[pathArray.length - 1];
            if (idString) {
               dataLayer.addToPlaylist(idString, null, null);
            }
         });

         $('#colorSelect').on('change', function (e) {
            var newColor = $(e.target).val();
            $('body').css('background-color', newColor);
            localStorage.setItem('themeColor', newColor);
            this.themeColor = newColor;
         });
      },

      _setTimeRemaining: function (response) {
         var current_ms = response.progress_ms;
         var duration_ms = response.item.duration_ms;
         $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));

         if (this.interval) {
            clearInterval(this.interval);
         }
         if (this.playState === 'playing') {
            this.interval = setInterval(function () {
               current_ms += 1000;
               if (current_ms <= response.item.duration_ms) {
                  $('#time').html(Util.millisToMinutesAndSeconds(current_ms) + ' / ' + Util.millisToMinutesAndSeconds(duration_ms));
               }
               else {
                  clearInterval(this.interval);
               }
            }.bind(this), 1000);
         }
      }
   }

   return TopSection;
});