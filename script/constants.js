(() => {
  'use strict';

  angular.module('myApp')
    .constant('myConfig', {
          url: 'wss://devbinary.pandats-api.com',
          port: '443',
          options: {
            path: '/socketio1/',
            transports: ["websocket", "polling"]
          }
      });
})()