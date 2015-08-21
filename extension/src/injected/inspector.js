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
    _angularInjector,
    _isMonitoringActive = true,
    _backUp = {
      digest: null,
      modules: {}
    };

  if (document.readyState === 'complete'){
    setTimeout(detectAngular, 0);
  } else {
    window.onload = function() {
      setTimeout(detectAngular, 0);
    };
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

      // We listen for async instrumentation instructions
      window.addEventListener('message', function(event){
        // We only accept messages from ourselves
        if (event.source != window || event.data.source !== 'angular-performance') {
          return;
        }

        var message = event.data;

        switch (message.task){

          case 'checkModuleName':
            var moduleServices = getNgModuleServices(message.moduleName);
            // If there is no services the method will return an empty object, if the module name is
            // invalid, it will return undefined.
            sendTask('reportModuleExistence', {
              moduleName: message.moduleName,
              services: (moduleServices) ? Object.keys(moduleServices) : undefined
            });
            break;

          case 'instrumentModuleServices':
            instrumentModuleServices(message.moduleName);
            break;

          case 'cleanUpInspectedApp':
            _isMonitoringActive = false;
            cleanUpInspectedApp();
            // Once everything is cleaned up, we can remove this script from the DOM
            sendTask('removeInspector');
            break;
        }
      });

      bootstrapInspector();
    }
  }

  /**
   * Function to set up all listeners and data mining tools
   */
  function bootstrapInspector(){

    _angularInjector = angular.element(document.querySelector('[ng-app],[data-ng-app]')).injector().get;

    instrumentDigest();
    initWatcherCount();
  }

  /**
   * This should clean up all that has been instrumented by the inspector and get them back
   * to their normal behaviour. (UnWrap everything)
   */
  function cleanUpInspectedApp(){
    restoreDigest();
    restoreModuleServices();
  }

  // ------------------------------------------------------------------------------------------
  //                                     Digest Monitoring
  // ------------------------------------------------------------------------------------------

  /**
   * Wraps the angular digest so that we can measure how long it take for the digest to happen.
   */
  function instrumentDigest(){

    var scopePrototype = Object.getPrototypeOf(getRootScope());
    _backUp.digest = scopePrototype.$digest;

    scopePrototype.$digest = function $digest() {
      var start = performance.now();
      _backUp.digest.apply(this, arguments);
      var time = (performance.now() - start);
      register('DigestTiming', {
        timestamp: Date.now(),
        time: time
      });
    };
  }

  /**
   * Restores the classic angular digest.
   */
  function restoreDigest(){
    Object.getPrototypeOf(getRootScope()).$digest = _backUp.digest;
  }

  // ------------------------------------------------------------------------------------------
  //                                Scope & Watcher Exploration
  // ------------------------------------------------------------------------------------------

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
    if (_isMonitoringActive) {
      setTimeout(initWatcherCount, 300);
    }
  }

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

    var module;

    try {
      module = angular.module(moduleName);
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

    _backUp.modules[moduleName] = {};
    var services = getNgModuleServices(moduleName);

    angular.forEach(Object.keys(services), function(serviceName){

      _backUp.modules[moduleName][serviceName] = {};
      var service = services[serviceName];

      angular.forEach(Object.getOwnPropertyNames(service), function(propertyName){

        // Early return for all properties that are not functions
        // arguments is a reserved property name
        if (propertyName === 'arguments' ||
            propertyName === 'caller' ||
            propertyName === 'callee' ||
            typeof service[propertyName] !== 'function' ||
            propertyName === 'constructor') {
          return;
        }

        var functionToWrap = _backUp.modules[moduleName][serviceName][propertyName] = service[propertyName];

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
  }

  /**
   * Restores the services functions as they were before being wrapped
   *
   * @param {String} [moduleName] - name of the module to be unwrapped. If not mentioned, everything
   *                                should be restored.
   */
  function restoreModuleServices(moduleName){

    var modules;

    if (moduleName){

      if (_backUp.modules[moduleName]) {
        modules = [moduleName];
      } else {
        throw new Error('angular performance - We tried to restore the module '+ moduleName + 'but ' +
          'we could not find any back up :(');
      }

    } else {
      modules = Object.keys(_backUp.modules);
    }

    angular.forEach(modules, function(module){
      var services = getNgModuleServices(module);

      angular.forEach(Object.keys(_backUp.modules[module]), function(service){
        angular.forEach(Object.keys(_backUp.modules[module][service]), function(fnName){
          services[service][fnName] = _backUp.modules[module][service][fnName]
        });
      });

      // Clean up back up
      delete _backUp.modules[module];
    });
  }

  // ------------------------------------------------------------------------------------------
  //                                        Utils
  // ------------------------------------------------------------------------------------------

  /**
   * Reports a metric
   *
   * @param {String} task  - task to do
   * @param {Object} [value] - data that can be sent along with the task
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
