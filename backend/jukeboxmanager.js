// JukeboxManager Module 
// 
// This is the main hub for all business logic.  It is basically layer between the controller module
// receiving requests from the front end and the Spotify Accessor module which communicates with the Spotify API.  

module.exports = function (spotifyAccessor, emitter, playlist_id, databaseLayer) {
   this.spotifyAccessor = spotifyAccessor;
   this.emitter = emitter;
   this.playlist_id = playlist_id;
   this.databaseLayer = databaseLayer;
   this.baseUrl = 'https://api.spotify.com/v1';
   this.playlistUrl = this.baseUrl + '/playlists/' + playlist_id;
   this.randomTrackIds = {};
   this.updateInterval = 5000;
   this.init = function () {
      this.updatePlaylistData(function (currentlyPlaying, playlistData, playState) {
         this.currentlyPlaying = currentlyPlaying && currentlyPlaying.item ? currentlyPlaying.item.id : null;
         this.playState = playState;
         setInterval(function () {
            this.updatePlaylistData(function (cp, pd, ps) {
               var newCurrentlyPlaying = cp && cp.item ? cp.item.id : null;
               if (this.currentlyPlaying !== newCurrentlyPlaying || ps !== this.playState) {
                  this.emitter.emit('update playlist', { currentlyPlaying: cp, playlistData: pd, playState: ps });
                  this.currentlyPlaying = newCurrentlyPlaying;
                  this.playState = ps;
               }
            }.bind(this));
         }.bind(this), this.updateInterval);
      }.bind(this));
   };

   this.updatePlaylistData = function (callback) {
      this.getUpdatedData(function (currentlyPlaying, playlistData) {
         var curTrackIsInPlaylist = currentlyPlaying && currentlyPlaying.context && currentlyPlaying.context.href === this.playlistUrl;
         var playState = 'stopped';

         if (curTrackIsInPlaylist) {
            playState = currentlyPlaying.is_playing ? 'playing' : 'paused';
            this.maybeRemoveTracks(currentlyPlaying, playlistData);
            // Add a random track if we are on the second to last track in the playlist
            if (this.currentlyPlayingIsSecondToLastTrack(currentlyPlaying, playlistData)) {
               this.addRandomTrackToPlaylist(function (body) {
                  this.getUpdatedData(function (currentlyPlaying, playlistData) {
                     if (callback) {
                        callback(currentlyPlaying, playlistData, playState);
                     }
                  }.bind(this));
               }.bind(this));
            }
            else if (callback) {
               playlistData.items = this.mapRandomTracks(playlistData);
               callback(currentlyPlaying, playlistData, playState);
            }
         }
         else if (callback) {
            callback(currentlyPlaying, playlistData, playState)
         }
      }.bind(this));
   }

   this.getUpdatedData = function (callback) {
      this.spotifyAccessor.getCurrentlyPlaying(function (currentlyPlaying) {
         this.spotifyAccessor.getPlaylistData(function (playlistData) {
            if (callback) {
               playlistData.items = this.mapRandomTracks(playlistData);
               callback(currentlyPlaying, playlistData);
            }
         }.bind(this));
      }.bind(this));
   };

   /**
    *   Identify tracks that have been added randomly and mark them as such
    */
   this.mapRandomTracks = function (playlistData) {
      var items = playlistData.items;
      return items.map(function (item) {
         item.track.isRandom = this.randomTrackIds[item.track.id];
         return item;
      }.bind(this));
   }

   /**
    *   Remove any remaining outdated tracks from the playlist
    */
   this.maybeRemoveTracks = function (currentlyPlaying, playlistData) {
      if (playlistData && playlistData.items && playlistData.items.length) {
         var toBeRemoved = this.getTracksToBeRemoved(currentlyPlaying, playlistData);
         if (toBeRemoved.length) {
            this.spotifyAccessor.removeTracks(this.mapDataForTrackRemoval(toBeRemoved));
         }
      }
   }

   this.mapDataForTrackRemoval = function (toBeRemoved) {
      return toBeRemoved.map(function (trackId) {
         return { uri: "spotify:track:" + trackId }
      });
   };

   // TODO - Do this better
   this.getTracksToBeRemoved = function (currentlyPlaying, playlistData) {
      var toBeRemoved = [];
      for (var i = 0; i < playlistData.items.length; i++) {
         var item = playlistData.items[i];
         var trackId = item.track.id;
         if (trackId === currentlyPlaying.item.id) {
            break;
         }
         toBeRemoved.push(trackId);
      }
      return toBeRemoved;
   }

   /**
    *   Add a random track to the playlist - either selected via a random search or from the jukebox history
    */
   this.addRandomTrackToPlaylist = function (callback) {
      var randomNumber = Math.floor(Math.random() * 10) + 1;
      if(randomNumber < 6) {
         this.getRandomTrackFromHistory(function(res) {
            this.randomTrackIds[res] = true;
            this.addTrackToPlaylist(res, callback);
         }.bind(this));
      }
      else {
         var url = this.getUrlForRandomSong();
         this.search({ url: url }, function (body) {
            var randomTrackData = body.tracks.items[0];
            var id = randomTrackData.id;
            this.randomTrackIds[id] = true;
            this.addTrackToPlaylist(id, callback);
         }.bind(this));
      }
   };

   this.getRandomTrackFromHistory = function(callback) {
      this.databaseLayer.getRandomTrackFromHistory(function(err, result){
         var res = result.recordset[0].SpotifyId;
         console.log(res);
         if(res.startsWith('spotify:track:')) {
            res = res.slice(14)
         }
         if(callback) {
            callback(res);
         }
      });
   }

   this.addTrackToPlaylist = function (id, callback) {
      this.spotifyAccessor.addTrackToPlaylist(id, callback);
   }

   this.search = function (config, callback) {
      if (!config.searchBy || config.searchBy === 'all') {
         config.searchBy = 'track,artist,album'
      }
      this.spotifyAccessor.search(config, callback);
   }

   this.removeTracks = function (toBeRemoved, callback) {
      this.spotifyAccessor.removeTracks(toBeRemoved, callback);
   }

   this.play = function () {
      this.spotifyAccessor.play();
   }

   this.pause = function () {
      this.spotifyAccessor.pause();
   }

   this.refresh = function (callback) {
      this.spotifyAccessor.getNewToken(callback);
   }

   /**
    *   Construct a search url containing a random single character and a random offset to achieve the effect of a "random" search 
    */
   this.getUrlForRandomSong = function () {
      var searchStringArray = ['%25a%25', 'a%25', '%25e%25', 'e%25', '%25i%25', 'i%25', '%25o%25', 'o%25'];
      var randomSearchString = searchStringArray[Math.floor(Math.random() * 8)];
      var randomOffset = Math.floor(Math.random() * 1000) + 1;
      return this.baseUrl + "/search?query=" + randomSearchString + "&offset=" + randomOffset + "&limit=1&type=track&market=US";
   }

   /**
    *   Return true if the currently playing track is second to last in the playlist
    */
   this.currentlyPlayingIsSecondToLastTrack = function (currentlyPlaying, playlist) {
      var tracks = playlist.items
      if (tracks && tracks.length && tracks.length > 2) {
         return currentlyPlaying.item.id === tracks[tracks.length - 2].track.id;
      }
      return true;
   };
};
