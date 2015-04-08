/*
 File that will be injected in the page by the content script in order to retrieve angular
 performance metrics.

 Heavily inspired by:
 - ng stats
 */
(function() {
  'use strict';
  console.log('angular-performance - Inspector loaded into webpage');

  if (document.readyState === 'complete'){
    console.log('Ready state complete');
    detectAngular();
  } else {
    console.log('Ready state not complete');
    window.onload(detectAngular)
  }

  function detectAngular(){
    if (typeof angular !== 'undefined') {

      window.postMessage({
        task: 'initDevToolPanel',
        source: 'angular-performance'
      }, '*');

      bootstrapInspector();
    }
  }


  function bootstrapInspector(){

    console.log('inspector.js - bootstrapping application');

    var $rootScope = getRootScope();
    var scopePrototype = Object.getPrototypeOf($rootScope);
    var oldDigest = scopePrototype.$digest;

    scopePrototype.$digest = function $digest() {
      var start = performance.now();
      oldDigest.apply(this, arguments);
      var time = (performance.now() - start);
      report('DigestTiming', {
        start: Date.now(),
        time: time
      });
    };
  }

  /**
   * Gets the angular root scope
   *
   * @returns {*}
   */
  function getRootScope(){
    if (typeof $rootScope !== 'undefined') {
      return $rootScope;
    }
    var scopeEl = document.querySelector('.ng-scope');
    if (!scopeEl) {
      return null;
    }
    return angular.element(scopeEl).scope().$root;
  }

  /**
   * Reports a
   *
   * @param {String} variable - can be 'digestTiming'
   * @param {Object} value    -  value to be registered with the variable
   */
  function report(variable, value){
    window.postMessage({
      source: 'angular-performance',
      task: 'register'+variable,
      data: value
    }, '*');
  }
})();