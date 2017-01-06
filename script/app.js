// function mainCtrl($scope, mySocket, socketIo) {
function mainCtrl($scope, socketIo) {

  let inition = false;
  $scope.socketConnect = false;
  $scope.connect = connect;
  $scope.disConnect = disConnect;
  $scope.quotes = [];

   $scope.$watch('socketConnect', (newVal) => {
     if (newVal) {
      socketIo.on('connect', () => console.log('connected'));
      socketIo.on('disconnect', () => console.log('disconnected'));
      socketIo.on('GetQuotes', (data) => {
          $scope.quotes = JSON.parse(data).quotesSnapshot;
      });
      socketIo.on('subscribe', (update) => {
          update.forEach((items) => {
            let pos = $scope.quotes.map((quote) => quote.Symbol).indexOf(items[1]);
            if (pos !== -1) {
              $scope.quotes[pos].change = $scope.quotes[pos].Price < items[0] ? 'green' : 'red';
              $scope.quotes[pos].Price = items[0]
            }
        });
      });
     }
   });

  function connect() {
    if (!inition){
      socketIo.init();
      inition = true;
    }
    else
      socketIo.connect();
    $scope.socketConnect = true;
    getData();
  }

  function disConnect() {
    if ($scope.socketConnect) {
      socketIo.disconnect();
      $scope.quotes = [];
    }
  }

  function getData() {
    socketIo.emit('GetQuotes', {reqID: parseInt(Math.random() * 9999)});
    socketIo.emit('QuotesSubscribe', {reqID: parseInt(Math.random() * 9999)}); 
  }
}

//----------------------------------------
function mySocket(socketFactory) {
  var myIoSocket = io.connect('wss://devbinary.pandats-api.com:443', {
        path: '/socketio1/',
        transports: ["websocket", "polling"],
        'reconnection delay': 1000,
        'reconnection limit': 1000,
        'max reconnection attempts': 'Infinity'
    });

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
}

//-------------------------------------------------
function socketIo($rootScope, $window) {
  // let socket1 = io('wss://devbinary.pandats-api.com:443', {
  //       path: '/socketio1/',
  //       transports: ["websocket", "polling"],
  //       'max reconnection attempts': 'Infinity'
  //   });
    let disconnecting = false;
    return {
      init() {
        $window.socket =  io('wss://devbinary.pandats-api.com:443', {
            path: '/socketio1/',
            transports: ["websocket", "polling"],
            'max reconnection attempts': 'Infinity'
        });
      },
      on(eventName, callback) {
        $window.socket.on(eventName, function() {
          let args = arguments;
          if (!disconnecting) {
            $rootScope.$apply(() => callback.apply($window.socket, args));
          } else {
            callback.apply($window.socket, args);
          }
        });
      },
      emit(eventName, data, callback) {
        $window.socket.emit(eventName, data, function() {
          let args = arguments;
          $rootScope.$apply(() => {
            if (callback) {
              callback.apply($window.socket, args);
            }
          });
        })
      },
      connect() {
        disconnecting = false;
        $window.socket.connect();
      },
      disconnect() {
        disconnecting = true;
        $window.socket.disconnect();
      }
    };
}
socketIo.$inject = ['$rootScope', '$window'];

//-----------------------------------------------------
  socketFactory.$inject = ['$rootScope', '$window'];

  function socketFactory($rootScope, $window) {

    var socket;
    var services = {
      on: on,
      emit: emit,
      init: init
    };

    return services;

    function init() {
      $window.socket = io('wss://devbinary.pandats-api.com:443', {
        path: '/socketio1/',
        transports: ["websocket", "polling"],
        'max reconnection attempts': 'Infinity'
      });
    }

    function on(eventName, callback) {
      $window.socket.on(eventName, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          callback.apply($window.socket, args);
        });
      });
    }

    function emit(eventName, data, callback) {
      $window.socket.emit(eventName, data, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          if (callback) {
            callback.apply($window.socket, args);
          }
        });
      });
    }
  }

//---------------------------------------------------------
function connectSer(socketIo) {
  return {
    init() {
      return socketIo;
    }
  }
}
connectSer.$inject = ['socketIo'];


// angular.module('myApp', ['btford.socket-io'])
angular.module('myApp', [])
  .controller('mainCtrl', mainCtrl)
  .factory('socketIo', socketIo)
  .factory('connectSer', connectSer)
  .factory('socketFactory', socketFactory)
  .factory('mySocket', mySocket);