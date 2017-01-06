mainCtrl.$inject = ['$scope', 'socketIo', 'myConfig'];

function mainCtrl($scope, socketIo, myConfig) {
  let vm = this;
  const urlPath = myConfig.url + ':' + myConfig.port;
  const option = myConfig.options;
  // vm.socketConnect = socketIo.inition;
  vm.connect = connect;
  vm.disConnect = disConnect;
  vm.quotes = [];

  $scope.$watch(
    angular.bind(vm, () => vm.socketConnect), 
    (newVal) => {
      if (newVal) {
        socketIo.on('disconnect', () => console.log('disconnected'));
        socketIo.on('connect', () => getData());
        socketIo.on('GetQuotes', (data) => GetQuotes(data));
        socketIo.on('subscribe', (update) => subscribe(update));
        socketIo.on('connect_error', (data) => errorHand(data));
     }
   });

  function connect() {
    !socketIo.inition ? socketIo.init(urlPath, option) : socketIo.connect();
    vm.socketConnect = socketIo.inition;
  }

  function disConnect() {
    if (vm.socketConnect) {
      socketIo.disconnect();
      vm.quotes = [];
    }
  }

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

  function getData() {
    socketIo.emit('GetQuotes', {reqID: parseInt(Math.random() * 9999)});
    socketIo.emit('QuotesSubscribe', {reqID: parseInt(Math.random() * 9999)}); 
    console.log('connected');
  }

  function errorHand(data) {
    console.log('error: ', data);
    vm.err = data;
    socketIo.disconnect();
  }
}

//-------------------------------------------------
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
        this.socket.on(eventName, function() {
          let args = arguments;
          if (!disconnecting) {
            $rootScope.$apply(() => callback.apply(this.socket, args));
          } else {
            callback.apply(this.socket, args);
          }
        });
      },
      emit(eventName, data, callback) {
        this.socket.emit(eventName, data, function() {
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

angular.module('myApp', [])
  .constant('myConfig', {
          url: 'wss://devbinary.pandats-api.com',
          port: '443',
          options: {
            path: '/socketio1/',
            transports: ["websocket", "polling"]
          }
      })
  .controller('mainCtrl', mainCtrl)
  .factory('socketIo', socketIo);