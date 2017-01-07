(() => {
  'use strict';

  angular.module('myApp')
    .controller('mainCtrl', mainCtrl);

  mainCtrl.$inject = ['$scope', 'socketIo', 'myConfig', '$log'];

  function mainCtrl($scope, socketIo, myConfig, $log) {
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
          socketIo.on('disconnect', () => $log.log('disconnected'));
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
      $log.log('connected');
    }

    function errorHand(data) {
      $log.log('error: ', data);
      vm.err = data;
      socketIo.disconnect();
    }
  }

})()