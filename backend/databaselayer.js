var addTrackQuery = "INSERT INTO history (SpotifyId, [TrackTitle], [TrackArtist]) VALUES (@spotify_id, @track_title, @track_artist)";

var sqlConfig = {
  user: 'fred',
  password: 'bedrock',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: 'igrafx_jukebox',
};

var addTrackToHistory = function (pool, idString, trackTitle, trackArtist) {
  try {
    pool.request()
      .input('spotify_id', sql.NVarChar(255), idString)
      .input('track_title', sql.NVarChar(255), trackTitle)
      .input('track_artist', sql.NVarChar(255), trackArtist)
      .query(addTrackQuery);
  }
  catch (err) {
    // TODO
  }
}
