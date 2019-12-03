define([], function () {

   var millisToMinutesAndSeconds = function (millis) {
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      return (seconds == 60 ? (minutes + 1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
   }

   var getRandomNumber = function (min, max) {
      return Math.floor(Math.random() * (max - min) + min);
   }

   return {
      millisToMinutesAndSeconds: millisToMinutesAndSeconds,
      getRandomNumber: getRandomNumber
   };
});
