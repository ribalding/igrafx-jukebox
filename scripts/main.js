// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'scripts',
    shim: {
      'socketio': {
        exports: 'io'
      }
    },
    paths: {
      socketio: '../node_modules/socket.io-client/dist/socket.io',
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['ui']);
