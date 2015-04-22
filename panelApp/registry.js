'use strict';

var _ = require('lodash');

/**
 * Object holding all the values that will be displayed in the interface
 *
 * @constructor
 */
function Registry(){

  var self = this;

  var
    BUFFER_MAX_ELEMENT = 300;

  var
    // Raw data
    _digestTiming = [],
    _digestTimingDistribution = {},
    _events = [],
    _watcherCount = [],
    _watcherCountDistribution = {},
    _functionTimings = {},

    // Plot data
    _digestTimingDistributionPlotData = [],
    _digestTimingPlotData = [],
    _digestRatePlotData = [],
    _watcherCountPlotData = [],
    _watcherCountDistributionPlotData = [],

    _locationMap = {},
    _locationCount = 0;


  // ------------------------------------------------------------------------------------------
  //                                     Angular Digest
  // ------------------------------------------------------------------------------------------

  /**
   * Used to save the last digest timing into the registry
   *
   * @param {Number} timestamp - timestamp in ms
   * @param {Number} time      - time in ms, length of the digest cycle
   */
  self.registerDigestTiming = function(timestamp, time){
    if (_digestTiming.length === BUFFER_MAX_ELEMENT){
      _digestTiming.shift();
    }
    _digestTiming.push({
      timestamp: timestamp,
      time: time
    });

    var roundTime = Math.round(time);

    _digestTimingDistribution[roundTime] =
      (_digestTimingDistribution[roundTime]) ? _digestTimingDistribution[roundTime] + 1 : 1;
  };

  /**
   * Gets the data to be fed into the plotting function for digest timing
   *
   * @param {Number} [number]     - number of item to return, default to 100
   * @param {Number} [resolution] - time between the sampled points in ms
   * @returns {Array[]}           - array of array containing each [x, y]
   */
  self.getDigestTimingPlotData = function(number, resolution){

    // Empty array
    _.forEach(_digestTimingPlotData, function(){
      _digestTimingPlotData.shift();
    });

    if (!number){
      number = 300;
    }
    if (!resolution){
      resolution = 100;
    }

    var
      now = Date.now(),
      i;

    for (i = 0; i < number ; i++){
      _digestTimingPlotData.push({x: now - ((number - i - 1) * resolution), y: 0})
    }

    for (i = _digestTiming.length - 1; i > -1 && now - ((number-1) * resolution) < _digestTiming[i].timestamp; i-- ){

      for (var index = number - 1, bin = 0 ; index > -1 ; index--) {
        if ((now - (resolution * (bin + 1)) < _digestTiming[i].timestamp &&
          _digestTiming[i].timestamp < now - (resolution * bin))) {

          _digestTimingPlotData[index] = { x: now - (resolution * bin), y: (_digestTimingPlotData[index].y + _digestTiming[i].time) / 2};
          break;
        }
        bin++;
      }
    }

    return _digestTimingPlotData;
  };

  /**
   * Gets the data to be fed into the plotting function for digest rate
   *
   * @param {Number}   [number]     - number of item to return, default to 100
   * @param {Number}   [resolution] - time between the sampled points in ms
   * @returns {Array[]}             - array of array containing each [x, y]
   */
  self.getDigestRatePlotData = function(number, resolution){

    _.forEach(_digestRatePlotData, function(){
      _digestRatePlotData.shift();
    });

    if (!number){
      number = 300;
    }
    if (!resolution){
      resolution = 1000;
    }

    var
      now = Date.now(),
      i;

    for (i = 0; i < number ; i++){
      _digestRatePlotData.push({x: now - ((number - i - 1) * resolution), y: 0})
    }

    for (i = _digestTiming.length - 1; i > -1 && now - ((number-1) * resolution) < _digestTiming[i].timestamp; i-- ){

      for (var index = number - 1, bin = 0 ; index > -1 ; index--) {
        if ((now - (resolution * (bin + 1)) < _digestTiming[i].timestamp &&
          _digestTiming[i].timestamp < now - (resolution * bin))) {

          _digestRatePlotData[index] = {x: now - (resolution * bin), y: _digestRatePlotData[index].y + 1};
          break;
        }
        bin++;
      }
    }

    return _digestRatePlotData;
  };

  /**
   * Get the distribution of the timings in for the digest data
   *
   * @returns {Array}
   */
  self.getDigestTimeDistributionPlotData = function(){

    _.forEach(_digestTimingDistributionPlotData, function(){
      _digestTimingDistributionPlotData.shift();
    });

    _.forEach(Object.keys(_digestTimingDistribution), function(key){
      _digestTimingDistributionPlotData.push({x: parseInt(key, 10), y: _digestTimingDistribution[key]});
    });

    // This is needed for graph init at the beginning of the session
    if (_digestTimingDistributionPlotData.length === 0){
      _digestTimingDistributionPlotData.push({x: 0, y: 0});
    }

    return _digestTimingDistributionPlotData;
  };

  /**
   * Gets the last registered timing according to the order of registration
   *
   * @returns {Object|null} timing           - null if no element registered yet
   * @returns {Number}      timing.timestamp - start time of the digest
   * @returns {Number}      timing.time      - length of the digest
   */
  self.getLastDigestTiming = function(){
    return (_digestTiming.length > 0) ? _digestTiming[_digestTiming.length-1] : null ;
  };

  /**
   * Returns digest/second instant
   *
   * @returns {number}
   */
  self.getLastSecondDigestCount = function(){
    var
      now = Date.now(),
      count = 0;

    // We go through the digest timing array from the most recent to the least recent entry. We stop
    // when the time difference between now and the entry exceeds 500ms.
    for (var i = _digestTiming.length - 1 ; i > -1 && _digestTiming[i].timestamp > now - 1000 ; i--){
      count++;
    }

    return count;
  };


  // ------------------------------------------------------------------------------------------
  //                                        Events
  // ------------------------------------------------------------------------------------------

  /**
   * Register a user event
   *
   * @param {Number} timestamp           - js timestamp when the event was fired
   * @param {Object} event               - event to be registered
   * @param {String} event.type          - event type ex: 'onclick'
   * @param {String} event.targetDOMPath - DOM path of the targeted event.
   */
  self.registerEvent = function(timestamp, event){
    if (_events.length === BUFFER_MAX_ELEMENT){
      _events.shift();
    }
    _events.push({
      timestamp: timestamp,
      event: event
    });
  };

  /**
   * Get event data corresponding to a dataSet.
   *
   * @param {String} chart - chart to get the event data for. Can be 'digest-time-chart' or
   *                         'digest-rate-chart'
   * @returns {Array[]}
   */
  self.getLastEventAnnotatorData = function(chart){

    var
      data = [],
      start;

    if (chart === 'digest-time-chart'){
      start = _digestTimingPlotData[_digestTimingPlotData.length - 1].x;
    } else if (chart === 'digest-rate-chart'){
      start = _digestRatePlotData[_digestRatePlotData.length - 1].x;
    }

    for (var i = _events.length - 1 ; i > -1 && _events[i].timestamp > start ; i--){
      data.push({
        timestamp: _events[i].timestamp,
        message: 'Event: '+_events[i].event.type+' on '+_events[i].event.targetDOMPath
      });
    }

    return data;
  };

  // ------------------------------------------------------------------------------------------
  //                                        Watchers
  // ------------------------------------------------------------------------------------------

  /**
   * Registers instant data on watcher
   *
   * @param {Number} timestamp            - corresponds to the timestamp of the take metric
   * @param {Object} watcher              - saved watcher data
   * @param {Number} watcher.watcherCount - number of watchers counted
   * @param {String} watcher.location     - current url of the taken metric
   */
  self.registerWatcherCount = function(timestamp, watcher){
    if (_watcherCount.length === BUFFER_MAX_ELEMENT){
      _watcherCount.shift();
    }
    _watcherCount.push({
      timestamp: timestamp,
      watcher: watcher
    });

    if (_watcherCountDistribution[watcher.location]){
      _watcherCountDistribution[watcher.location] =  Math.round((_watcherCountDistribution[watcher.location] + watcher.watcherCount) / 2);
    } else {
      _watcherCountDistribution[watcher.location] = watcher.watcherCount;
      _locationMap[watcher.location] = _locationCount;
      _locationCount++;
    }
  };

  /**
   * Gets the watchers plotted data as for the watcher count history.
   * The plotted data is a progressively filled graph. Once the buffer is full, the time flies.
   *
   * @returns {Array[]}
   */
  self.getWatchersCountPlotData = function(){

    // Empty array
    _.forEach(_watcherCountPlotData, function(){
      _watcherCountPlotData.shift();
    });

    var i;

    // Get the last watcher count registrations
    for (i = _watcherCount.length - 1; i > -1 ; i-- ){
      _watcherCountPlotData[i] = {x: _watcherCount[i].timestamp, y: _watcherCount[i].watcher.watcherCount}
    }

    // This is needed for graph init at the beginning of the session
    if (_watcherCountPlotData.length === 0){
      _watcherCountPlotData.push({x: 0, y: 0});
    }

    return _watcherCountPlotData;
  };

  /**
   * Gets the distribution of the watcher count according to the location of the page.
   *
   * @returns {Array[]}
   */
  self.getWatchersCountDistributionPlotData = function(){
    // Empty array
    _.forEach(_watcherCountDistributionPlotData, function(){
      _watcherCountDistributionPlotData.shift();
    });

    _.forEach(Object.keys(_watcherCountDistribution), function(key){
      _watcherCountDistributionPlotData.push({x: _locationMap[key], y: _watcherCountDistribution[key]});
    });

    // This is needed for graph init at the beginning of the session
    if (_watcherCountDistributionPlotData.length === 0){
      _watcherCountDistributionPlotData.push({x: 0, y: 0});
    }

    return _watcherCountDistributionPlotData;
  };

  // ------------------------------------------------------------------------------------------
  //                              Service Functions execution times
  // ------------------------------------------------------------------------------------------

  /**
   * Registers a sync function execution into the registry. The data structure is stored as follow in
   * _functionTimings:
   *
   * The first key represents the angular module
   * The second key represents the service
   * The last key represents the function
   *
   * ex:
   * _functionTiming['ng-app']['MainService']['addSomething']
   *
   * That objects stores the number of calls to the function, the average sync execution time and the
   * async execution time.
   *
   * @param {Object} executionMessage - Object representing a function execution
   * @param {String} executionMessage.module - module containing the service from which is executed
   *                                           the function
   * @param {String} executionMessage.service - service from which is executed the function
   * @param {String} executionMessage.func - the executed function
   * @param {String} executionMessage.time - the sync execution time of the function
   */
  self.registerSyncExecution = function(executionMessage){

    if (!_functionTimings[executionMessage.module]){
      _functionTimings[executionMessage.module] = {};
    }

    if (!_functionTimings[executionMessage.module][executionMessage.service]){
      _functionTimings[executionMessage.module][executionMessage.service] = {};
    }

    var service = _functionTimings[executionMessage.module][executionMessage.service];

    if (!service[executionMessage.func]){
      service[executionMessage.func] = {
        count: 1,
        syncExecTime: Math.round(executionMessage.time),
        asyncExecTime: 0,
        impactScore: Math.round(executionMessage.time)
      }
    } else {
      service[executionMessage.func].count++;
      service[executionMessage.func].syncExecTime =
        Math.round((service[executionMessage.func].syncExecTime + executionMessage.time) / 2);
      service[executionMessage.func].impactScore =
        (service[executionMessage.func].syncExecTime + service[executionMessage.func].asyncExecTime) * service[executionMessage.func].count / 100;
    }
  };

  /**
   * Registers an qsync function execution into the registry.
   *
   * @see registerSyncExecution for data structure
   *
   * @param {Object} executionMessage - Object representing a function execution
   * @param {String} executionMessage.module - module containing the service from which is executed
   *                                           the function
   * @param {String} executionMessage.service - service from which is executed the function
   * @param {String} executionMessage.func - the executed function
   * @param {String} executionMessage.time - the async execution time of the function
   */
  self.registerASyncExecution = function(executionMessage){
    var service = _functionTimings[executionMessage.module][executionMessage.service];

    service[executionMessage.func].asyncExecTime =
      Math.round((service[executionMessage.func].asyncExecTime + executionMessage.time) / 2);
    service[executionMessage.func].impactScore =
      (service[executionMessage.func].syncExecTime + service[executionMessage.func].asyncExecTime) * service[executionMessage.func].count / 100;
  };

  /**
   * Gets the module data function execution in a sorted array by most impact first
   *
   * @param {String} module   - module to get the data from
   * @param {Number} [limit]  - only returns the <limit> most impacting function executions
   * @returns {Array}
   */
  self.getModuleFunctionsExecutionData = function(module, limit){

    var toReturn = [];

    _.forEach(_functionTimings[module], function(functions, service){
      _.forEach(functions, function(execData, func){
        toReturn.push({
          service: service,
          func: func,
          syncExecTime: execData.syncExecTime,
          asyncExecTime: execData.asyncExecTime,
          count: execData.count,
          impactScore: execData.impactScore
        });
      });
    });

    // We want to have result from the function that has most impact on the software to the one that
    // has the less impact.
    toReturn = _.sortBy(toReturn, function(execData){
      return - execData.impactScore
    });

    if(limit){
      toReturn = _.take(toReturn, limit);
    }

    return toReturn;
  };

  /**
   * Gets the location map that makes the correspondence between the Location and their id
   *
   * @returns {{}}
   */
  self.getLocationMap = function(){
    return _locationMap;
  }
}

module.exports = Registry;
