define(['jquery'], function($){
  function DataLayer() {
    //Nothing for now
  }

  DataLayer.prototype = {
    getJukeboxData: async function(callback) {
      let response = await $.get('/jukebox');
      callback && callback(response);
    },

    search: async function(searchString, searchBy, callback) {
      let response = await $.ajax({
        url: '/search',
        data: { searchString: searchString, searchBy: searchBy }
      });
      callback && callback(response);
    },

    addToPlaylist: async function(idString, artist, title, callback) {
      let response = await $.ajax({
        url: '/add',
        data: {
          idString: idString,
          artist: artist, 
          title: title 
        }
      });
      callback && callback(response);
    },

    removeFromPlaylist: async function(idString, callback) {
      let response = await $.ajax({
        url: '/remove',
        data : { idString: idString }
      });
      callback && callback(response);
    },

    play: async function(callback) {
      let response = await $.ajax({ url:'/play' });
      callback && callback(response);
    },

    pause: async function(callback) {
      let response = await $.ajax({ url:'/pause' });
      callback && callback(response);
    }
  }

  return DataLayer;
});
