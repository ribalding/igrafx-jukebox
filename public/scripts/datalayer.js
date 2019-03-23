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

    addToPlaylist: function(idString, callback) {
      $.ajax({
        url: '/add',
        data: {
          idString: idString
        }
      }).done(function(response) {
        callback(response);
      });
    }
  }

  return DataLayer;
});
