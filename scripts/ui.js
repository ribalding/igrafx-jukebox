define([
   'jquery',
   'datalayer',
   'tracklistsection',
   'topsection',
   'socketio',
   'navbar'
], function (
   $,
   DataLayer,
   TrackListSection,
   TopSection,
   io,
   Navbar) {

   var socket = io();
   var dataLayer;
   var trackListSection;
   var topSection;
   var navbar;
   var themeColor;

   socket.on('update playlist', function (data) {
      update(data.currentlyPlaying, data.playlistData, data.playState);
   });

   socket.on('update playstate', function (data) {
      update(currentlyPlaying, playlistData, data.playState);
   });

   function init() {
      dataLayer.getJukeboxData(function (response) {
         $('#loading').hide();
         setTheme();
         update(response.currentlyPlaying, response.playlistData, response.playState);
      });
   }

   
   function setTheme() {
      themeColor = localStorage.getItem('themeColor') || '#003366';
      $('body').css('background-color', themeColor);
   }


   function update(cp, pd, ps) {
      if(!topSection) {
         topSection = new TopSection(cp, pd, ps, dataLayer, themeColor);
      }
      else {
         topSection.update(cp, pd, ps);
      }

      if(!trackListSection) {
         trackListSection = new TrackListSection(pd, cp.item.id, dataLayer);
      }
      else {
         trackListSection.updatePlaylistData(pd, cp.item.id);
      }

      if(!navbar) {
         navbar = new Navbar($('#navbarSection'), function (playlistTabClicked) {
            trackListSection.toggle(playlistTabClicked);
         });
      }


   }

   $(document).ready(function () {
      dataLayer = new DataLayer();
      init();
   });

});
