(() => {
  'use strict'
  
  angular.module('myApp')
    .factory('socketIo', socketIo)

  socketIo.$inject = ['$rootScope'];
  function socketIo($rootScope) {
    let disconnecting = false;
    return {
      inition: false,
      socket: {},
      init(url, options) {
        this.socket = io(url, options);
        this.inition = true;
      },
      on(eventName, callback) {
        this.socket.on(eventName, function () {
          let args = arguments;
          if (!disconnecting) {
            $rootScope.$apply(() => callback.apply(this.socket, args));
          } else {
            callback.apply(this.socket, args);
          }
        });
      },
      emit(eventName, data, callback) {
        this.socket.emit(eventName, data, function () {
          let args = arguments;
          $rootScope.$apply(() => {
            if (callback) {
              callback.apply(this.socket, args);
            }
          });
        })
      },
      connect() {
        disconnecting = false;
        this.socket.connect();
      },
      disconnect() {
        disconnecting = true;
        this.socket.disconnect();
      }
    };
  }

})()