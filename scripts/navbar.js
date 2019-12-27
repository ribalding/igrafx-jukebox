define(['jquery', 'mustache', 'datalayer', 'util'], function ($, Mustache, DataLayer, Util) {
   var templates = {
      navbar: [
         '<div class="navigation">',
         '<span class="playlistTab {{^searchIsActive}}active{{/searchIsActive}}">Playlist</span>',
         '<span class="searchTab {{#searchIsActive}}active{{/searchIsActive}}">Search</span>',
         '</div>'
      ].join('')
   };

   function Navbar($parentElement, onTabClicked) {
      this.$parentElement = $parentElement;
      this.searchIsActive = false;
      this.onTabClicked = onTabClicked;
      this._render();
   }

   Navbar.prototype = {
      _render: function () {
         this.$e = $(Mustache.render(templates.navbar, { searchIsActive: this.searchIsActive }));
         this.$parentElement.html(this.$e);
         this._registerListeners();
      },

      _registerListeners: function () {
         var $playlistTab = this.$e.find('.playlistTab');
         var $searchTab = this.$e.find('.searchTab');
         $playlistTab.on('click', function () {
            if (this.searchIsActive) {
               this.searchIsActive = false;
               this._render();
               this.onTabClicked(!this.searchIsActive);
            }
         }.bind(this));

         $searchTab.on('click', function () {
            if (!this.searchIsActive) {
               this.searchIsActive = true;
               this._render();
               this.onTabClicked(!this.searchIsActive);
            }
         }.bind(this));
      },
   };

   return Navbar;
});