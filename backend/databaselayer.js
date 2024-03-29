module.exports = function (sql, pool) {
   this.sql = sql;
   this.pool = pool;

   var addTrackQuery = "INSERT INTO history (SpotifyId, [TrackTitle], [TrackArtist]) VALUES (@spotify_id, @track_title, @track_artist)";
   var selectTrackQuery = "SELECT * FROM history WHERE ID = @id"
   var selectRandomTrackQuery = "SELECT TOP (1) [SpotifyId] FROM history ORDER BY NEWID()";

   this.addTrackToHistory = function (idString, trackTitle, trackArtist) {
      try {
         this.pool.request()
            .input('spotify_id', sql.NVarChar(255), idString)
            .input('track_title', sql.NVarChar(255), trackTitle)
            .input('track_artist', sql.NVarChar(255), trackArtist)
            .query(addTrackQuery);
      }
      catch (err) {
         // TODO
      }
   }

   this.getRandomTrackFromHistory = function (callback) {
      try {
         this.pool.request().query(selectRandomTrackQuery, (err, result) => {
            if(callback) {
               callback(err, result);
            }
         });
      }
      catch (err) {

      }
   }
}

