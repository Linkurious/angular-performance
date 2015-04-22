/*
 File that will be injected in the page by the content script in order to retrieve angular
 performance metrics.

 Heavily inspired by:
 - ng stats
 - ng inspector
 - Angular Inspector
 - Batarang

 */
(function() {
  'use strict';

  var
    _angularInjector;

  console.log('angular-performance - Inspector loaded into webpage');

  if (document.readyState === 'complete'){
    console.log('Ready state complete');
    detectAngular();
  } else {
    console.log('Ready state not complete');
    window.onload(detectAngular)
  }

  /**
   * If angular is detected, bootstraps the inspector
   */
  function detectAngular(){
    if (typeof angular !== 'undefined') {

      window.postMessage({
        task: 'initDevToolPanel',
        source: 'angular-performance-inspector'
      }, '*');

      bootstrapInspector();
    }
  }

  /**
   * Function to set up all listeners and data mining tools
   */
  function bootstrapInspector(){

    console.log('inspector.js - bootstrapping application');

    _angularInjector = angular.element(document.querySelector('[ng-app]')).injector().get;

    var $rootScope = getRootScope();
    var scopePrototype = Object.getPrototypeOf($rootScope);
    var oldDigest = scopePrototype.$digest;

    scopePrototype.$digest = function $digest() {
      var start = performance.now();
      oldDigest.apply(this, arguments);
      var time = (performance.now() - start);
      register('DigestTiming', {
        timestamp: Date.now(),
        time: time
      });
    };

    // We listen for async instrumentation instructions
    window.addEventListener('message', function(event){
      // We only accept messages from ourselves
      if (event.source != window || event.data.source !== 'angular-performance') {
        return;
      }

      var message = event.data;

      if (message.task === 'checkModuleName'){

        var moduleServices = getNgModuleServices(message.moduleName);

        // If there is no services the method will return an empty object, if the module name is
        // invalid, it will return undefined.

        sendTask('reportModuleExistence', {
          moduleName: message.moduleName,
          services: (moduleServices) ? Object.keys(moduleServices) : undefined
        });
      } else if (message.task === 'instrumentModuleServices'){
        instrumentModuleServices(message.moduleName);
      }
    });

    initWatcherCount();
  }

  /**
   * Function to be called once to init the watcher retrieval.
   */
  function initWatcherCount(){
    register('RootWatcherCount', {
      timestamp: Date.now(),
      watcher:{
        watcherCount: getWatcherCountForScope(),
        location: window.location.href
      }
    });
    setTimeout(initWatcherCount, 300);
  }

  // ------------------------------------------------------------------------------------------
  //                                Scope & Watcher Exploration
  // ------------------------------------------------------------------------------------------


  /**
   * Retrieves the watcher count for a particular scope
   *
   * @param {angular.scope} [$scope] - angular scope instance
   * @returns {number}               - angular scope count
   */
  function getWatcherCountForScope($scope) {
    var count = 0;
    iterateScopes($scope, function($scope) {
      count += getWatchersFromScope($scope).length;
    });
    return count;
  }

  /**
   * Apply a function down the angular scope
   *
   * @param {angular.scope} [current] - current angular $scope
   * @param {Function}      fn        - function to apply down the scope
   * @returns {*}
   */
  function iterateScopes(current, fn) {
    if (typeof current === 'function') {
      fn = current;
      current = null;
    }
    current = current || getRootScope();
    current = makeScopeReference(current);
    if (!current) {
      return;
    }
    var ret = fn(current);
    if (ret === false) {
      return ret;
    }
    return iterateChildren(current, fn);
  }

  /**
   * Apply a function on a scope siblings (same scope level) and down to their children
   *
   * @param {angular.scope} start - starting scope of the iteration
   * @param {Function}      fn    - function to be applied on the different scopes
   * @returns {*}
   */
  function iterateSiblings(start, fn) {
    var ret;
    while (!!(start = start.$$nextSibling)) {
      ret = fn(start);
      if (ret === false) {
        break;
      }

      ret = iterateChildren(start, fn);
      if (ret === false) {
        break;
      }
    }
    return ret;
  }

  /**
   * Apply a function on all the children scopes and their respective siblings
   *
   * @param {angular.scope} start - start node of the
   * @param {Function}      fn    - function to apply
   * @returns {*}
   */
  function iterateChildren(start, fn) {
    var ret;
    while (!!(start = start.$$childHead)) {
      ret = fn(start);
      if (ret === false) {
        break;
      }

      ret = iterateSiblings(start, fn);
      if (ret === false) {
        break;
      }
    }
    return ret;
  }


  /**
   * Gets the angular root scope
   *
   * @returns {angular.scope}
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
   * Retrieve all watchers from a scope
   *
   * @param {angular.scope} scope - angular scope to get the watchers from
   * @returns {Array}
   */
  function getWatchersFromScope(scope) {
    return scope && scope.$$watchers ? scope.$$watchers : [];
  }

  /**
   * Gets the id of a scope
   *
   * @param {angular.scope} scope - angular scope to get the id from
   * @returns {angular.scope}
   */
  function makeScopeReference(scope) {
    if (isScopeId(scope)) {
      scope = getScopeById(scope);
    }
    return scope;
  }

  /**
   * Gets the scope from an ID
   *
   * @param {String|Number} id - scope id
   * @returns {angular.scope}
   */
  function getScopeById(id) {
    var myScope = null;
    iterateScopes(function(scope) {
      if (scope.$id === id) {
        myScope = scope;
        return false;
      }
    });
    return myScope;
  }

  /**
   * Check if the scope passed as an argument is an id or not.
   *
   * @param {angular.scope} scope
   * @returns {boolean}
   */
  function isScopeId(scope) {
    return typeof scope === 'string' || typeof scope === 'number';
  }

  // ------------------------------------------------------------------------------------------
  //                                     Module & Services
  // ------------------------------------------------------------------------------------------

  /**
   * Gets all the services name from the specified module
   *
   * @param {String}  moduleName - name of the module to get the services from
   * @param {Object}  [services] - already found services (parent module) can be null
   * @returns {Object|undefined} map of all the angular services linked to the specified module.
   *                             returns undefined if the module isn't defined
   */
  function getNgModuleServices(moduleName, services){

    if (!services) {
      services = {};
    }

    try {
      var module = angular.module(moduleName);
    } catch(e){
      return;
    }

    angular.forEach(module._invokeQueue, function(service) {
      if (service[0] === '$provide' && service[1] === 'service') {
        services[service[2][0]] = _angularInjector(service[2][0]);
      }
    });

    angular.forEach(module.requires, function(dependencyModule) {
      getNgModuleServices(dependencyModule, services)
    });

    return services;
  }

  /**
   * This methods adds timers to all the functions of all the services of a given module
   *
   * @param {String} moduleName - module name to instrument.
   */
  function instrumentModuleServices(moduleName){

    var services = getNgModuleServices(moduleName);

    angular.forEach(Object.keys(services), function(serviceName){

      var service = services[serviceName];

      angular.forEach(Object.getOwnPropertyNames(service), function(propertyName){

        // Early return for all properties that are not functions
        if (typeof service[propertyName] !== 'function' || propertyName === 'constructor') {
          return;
        }

        var functionToWrap = service[propertyName];

        // We Wrap all the service functions to measure execution time.
        service[propertyName] = function(){
          var
            start = performance.now(),
            // Execute the function as usual
            result = functionToWrap.apply(this, arguments);

          // Register execution time in the extension registry
          register('SyncServiceFunctionCall', {
            module: moduleName,
            service: serviceName,
            func: propertyName,
            time: performance.now() - start
          });

          // We only consider promises since it is the default async handling in angular.
          if (result && typeof result.then === 'function') {
            // We reset the timer so that only async time gets taken.
            start = performance.now();

            // We Append our timing promise to the actual promise
            result.then(function() {
              register('ASyncServiceFunctionCall', {
                module: moduleName,
                service: serviceName,
                func: propertyName,
                time: performance.now() - start
              });
            })
          }
          return result;
        }
      })
    });

    console.log('Module: ' + moduleName + ' successfully instrumented');
  }

  // ------------------------------------------------------------------------------------------
  //                                        Utils
  // ------------------------------------------------------------------------------------------

  /**
   * Reports a metric
   *
   * @param {String} task  - task to do
   * @param {Object} value - data that can be sent along with the task
   */
  function sendTask(task, value){
    window.postMessage({
      source: 'angular-performance-inspector',
      task: task,
      data: value
    }, '*');
  }

  /**
   * Register a metric into the devtool instance registry
   *
   * @param {String} variable - can be 'digestTiming'
   * @param {Object} value    - value to be registered with the variable
   */
  function register(variable, value){
    sendTask('register'+variable, value);
  }
})();