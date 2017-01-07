(() => {
  'use strict'

  angular.module('myApp')
    .filter('myRound', myRound)
  
  function myRound() {
    return function(item, accur) {
      return Math.floor(item * 100000) / 100000;
    }
  }

})()