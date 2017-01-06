function mainCtrl($scope, socketIo) {

  let vm = this;
  // vm.socketConnect = socketIo.inition;
  vm.connect = connect;
  vm.disConnect = disConnect;
  vm.quotes = [];

  $scope.$watch(
    angular.bind(vm, () => vm.socketConnect), 
    (newVal) => {
      if (newVal) {
        socketIo.on('connect', () => console.log('connected'));
        socketIo.on('disconnect', () => console.log('disconnected'));
        socketIo.on('GetQuotes', (data) => GetQuotes(data));
        socketIo.on('subscribe', (update) => subscribe(update));
     }
   });

  function GetQuotes(data) {
    vm.quotes = JSON.parse(data).quotesSnapshot;
  }
 
  function subscribe(update) {
    update.forEach((items) => {
      let pos = vm.quotes.map((quote) => quote.Symbol).indexOf(items[1]);
      if (pos !== -1) {
        vm.quotes[pos].change = vm.quotes[pos].Price < items[0] ? 'green' : 'red';
        vm.quotes[pos].Price = items[0]
      }
    });
  }

  function connect() {
    !socketIo.inition ? socketIo.init() : socketIo.connect();
    vm.socketConnect = socketIo.inition;
    getData();
  }

  function disConnect() {
    if (vm.socketConnect) {
      socketIo.disconnect();
      vm.quotes = [];
    }
  }

  function getData() {
    socketIo.emit('GetQuotes', {reqID: parseInt(Math.random() * 9999)});
    socketIo.emit('QuotesSubscribe', {reqID: parseInt(Math.random() * 9999)}); 
  }
}

//-------------------------------------------------
function socketIo($rootScope, $window) {
    let disconnecting = false;
    return {
      inition: false,
      init() {
        $window.socket =  io('wss://devbinary.pandats-api.com:443', {
            path: '/socketio1/',
            transports: ["websocket", "polling"]
        });
        this.inition = true;
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

angular.module('myApp', [])
  .controller('mainCtrl', mainCtrl)
  .factory('socketIo', socketIo);