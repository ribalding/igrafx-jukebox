# iGrafx Jukebox


## Setup
1. Clone project
2. Make sure you have node.js installed on your computer
3. Navigate to root folder in command line - run 'npm install'
4. Create a file called 'config.json' in the root folder.  It must contain a single json object with three properties - client_id,    client_secret and playlist_id.  The first two refer to your spotify client secret and client ID, which can be found in the spotify developer portal.  The last is the id for the playlist that will function as the jukebox.

## Starting the jukebox
1. Run 'node app.js' from the command line
2. In the browser, navigate to localhost:8888/login.html 
3. Click "login to spotify" button
