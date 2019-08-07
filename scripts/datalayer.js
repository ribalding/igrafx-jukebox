define(['jquery', 'mustache'], function($, Mustache){
  function DataLayer() {
    //Nothing for now
  }

  DataLayer.prototype = {
    getJukeboxData: function(callback) {
      $.get('/jukebox', function(response) {
        callback(response);
      });
    },

    search: function(searchString, callback) {
      $.ajax({
        url: '/search',
        data: {
          searchString: searchString
        }
      }).done(function(response) {
        callback(response);
      });
    },

    addToPlaylist: function(idString, artist, title, callback) {
      $.ajax({
        url: '/add',
        data: {
          idString: idString,
          artist: artist,
          title: title
        }
      }).done(function(response) {
        callback(response);
      });
    },

    play: function(callback) {
      $.ajax({
        url:'/play'
      }).done(function(response){
        callback(response);
      });
    },

    pause: function(callback) {
      $.ajax({
        url:'/pause'
      }).done(function(response){
        callback(response);
      });
    }
  }

  return DataLayer;
});
