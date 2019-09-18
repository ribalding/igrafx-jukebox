# iGrafx Jukebox


## General Setup
1. Clone project
2. Make sure you have node.js installed on your computer
3. Navigate to root folder in command line - run 'npm install'
4. Create a file called 'config.json' in the root folder.  It must contain a single json object with three properties - client_id,    client_secret and playlist_id.  The first two refer to your spotify client secret and client ID, which can be found in the spotify developer portal.  The last is the id for the playlist that will function as the jukebox.

## Starting the jukebox
1. Run 'node app.js' from the command line
2. In the browser, navigate to localhost:8888/login.html 
3. Click "login to spotify" button

## Database Setup 
NOTE: This is still very much in devlopment and is likely to change substantially.

If you want to enable database functionality:

1. Create an MSSQL database with one table called "history" which will contain the following columns: 

ID (int, primary key, non null)
TrackTitle (nvarchar(255))
TrackArtist (nvarchar(255))
DateAdded (datetime)
UserSelected (tinyint)
AddedBy (nvarchar(255))
SpotifyId (nvarchar(255))

2. In your config.json file, add 2 more properties called "db_enabled" and "db_config".  The former will contain a boolean which should be set to True if you want db functionaliy enabled.  The latter will be a json object with the following properties: user, password, server and database.  Fill in the appropriate corresponding information regarding your newly created database.

## Trello Board

https://trello.com/b/zpEbowRy/igrafx-jukebox
