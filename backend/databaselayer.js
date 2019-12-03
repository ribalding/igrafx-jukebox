module.exports = function (sql, pool) {
   this.sql = sql;
   this.pool = pool;

   var addTrackQuery = "INSERT INTO history (SpotifyId, [TrackTitle], [TrackArtist]) VALUES (@spotify_id, @track_title, @track_artist)";
   var selectTrackQuery = "SELECT * FROM history WHERE ID = @id"

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

   this.getTrackFromHistory = function (id) {
      try {
         return this.pool.request().input('id', sql.Int, id).query(selectTrackQuery);
      }
      catch (err) {

      }
   }
}

