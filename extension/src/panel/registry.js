'use strict';

/**
 * Object holding all the values that will be displayed in the interface
 *
 * @constructor
 */
function Registry(){

  var self = this;

  var
    BUFFER_MAX_ELEMENT = 300,
    EVENT_TYPE_MAP = {
      'mousedown': 'MOUSE_EVENT',
      'mouseup': 'MOUSE_EVENT',
      'click': 'MOUSE_EVENT',
      'dblclick': 'MOUSE_EVENT',
      //Mouse move event id too chatty
      //'mousemove' : 'MOUSE_EVENT',
      'mouseover': 'MOUSE_EVENT',
      'mouseout': 'MOUSE_EVENT',
      'mousewheel': 'MOUSE_EVENT',

      'keydown': 'KEYBOARD_EVENT',
      'keyup': 'KEYBOARD_EVENT',
      'keypress': 'KEYBOARD_EVENT',
      'textInput': 'KEYBOARD_EVENT',

      'touchstart': 'TOUCH_EVENT',
      'touchmove': 'TOUCH_EVENT',
      'touchend': 'TOUCH_EVENT',
      'touchcancel': 'TOUCH_EVENT',

      'resize': 'CONTROL_EVENT',
      'scroll': 'CONTROL_EVENT',
      'zoom': 'CONTROL_EVENT',
      'focus': 'CONTROL_EVENT',
      'blur': 'CONTROL_EVENT',
      'select': 'CONTROL_EVENT',
      'change': 'CONTROL_EVENT',
      'submit': 'CONTROL_EVENT',
      'reset': 'CONTROL_EVENT'
    };

  var
    _digestTiming = [],
    _events = [];


  // ------------------------------------------------------------------------------------------
  //                                     Angular Digest
  // ------------------------------------------------------------------------------------------

  /**
   * Used to save the last digest timing into the registry
   *
   * @param {Number} timestamp - timestamp in ms
   * @param {Number} time - time in ms, length of the digest cycle
   */
  self.registerDigestTiming = function(timestamp, time){
    if (_digestTiming.length === BUFFER_MAX_ELEMENT){
      _digestTiming.shift();
    }
    _digestTiming.push({
      timestamp: timestamp,
      time: time
    });
  };

  /**
   * Gets the data to be fed into the plotting function for digest timing
   *
   * @param {Number} [number] - number of item to return, default to 100
   * @param {Number} [resolution] - time between the sampled points in ms
   * @returns {Array[]} array of array containing each [x, y]
   */
  self.getDigestTimingPlotData = function(number, resolution){

    var test = performance.now();

    if (!number){
      number = 300;
    }
    if (!resolution){
      resolution = 100;
    }

    var
      now = Date.now(),
      data = new Array(number);

    data = _.map(data, function(item, index){return [now - ((number - index - 1) * resolution), 0]});

    for (var i = _digestTiming.length - 1; i > -1 && now - ((number-1) * resolution) < _digestTiming[i].timestamp; i-- ){

      for (var index = number - 1, bin = 0 ; index > -1 ; index--) {
        if ((now - (resolution * (bin + 1)) < _digestTiming[i].timestamp &&
          _digestTiming[i].timestamp < now - (resolution * bin))) {

          data[index] = [now - (resolution * bin), (data[index][1] + _digestTiming[i].time) / 2];
          break;
        }
        bin++;
      }
    }

    console.log('getDigestTimingPlotData time: ', performance.now() - test);

    return data;
  };

  /**
   * Gets the data to be fed into the plotting function for digest rate
   *
   * @param {Number} [number] - number of item to return, default to 100
   * @param {Number} [resolution] - time between the sampled points in ms
   * @returns {Array[]} array of array containing each [x, y]
   */
  self.getDigestRatePlotData = function(number, resolution){

    var test = performance.now();

    if (!number){
      number = 300;
    }
    if (!resolution){
      resolution = 1000;
    }

    var
      now = Date.now(),
      data = new Array(number);
    data = _.map(data, function(item, index){return [now - ((number - index - 1) * resolution), 0]});

    for (var i = _digestTiming.length - 1; i > -1 && now - ((number-1) * resolution) < _digestTiming[i].timestamp; i-- ){

      for (var index = number - 1, bin = 0 ; index > -1 ; index--) {
        if ((now - (resolution * (bin + 1)) < _digestTiming[i].timestamp &&
          _digestTiming[i].timestamp < now - (resolution * bin))) {

          data[index] = [now - (resolution * bin), data[index][1] + 1];
          break;
        }
        bin++;
      }
    }

    console.log('getDigestRatePlotData time: ', performance.now() - test);

    return data;
  };

  /**
   * Gets the last registered timing according to the order of registration
   *
   * @returns {Object|null} timing - null if no element registered yet
   * @returns {Number} timing.timestamp - start time of the digest
   * @returns {Number} timing.time      - length of the digest
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
   * @param {Number} timestamp - js timestamp when the event was fired
   * @param {Object} event - event to be registered
   * @param {String} event.type - event type ex: 'onclick'
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
   * @param {Array[]} dataSet - dataSet to adapt to
   * @returns {Array[]}
   */
  self.getEventPlotData = function(dataSet){


    var test = performance.now();
    var
      data = [],
      start = dataSet[0][0],
      end = dataSet[dataSet.length - 1][0];

    for (var i = _events.length - 1 ; i > -1 && _events[i].timestamp > start ; i--){
      if (_events[i].timestamp < end ){
        data.push({
          min: _events[i].timestamp,
          max: _events[i].timestamp,
          eventType: EVENT_TYPE_MAP[_events[i].event.type],
          title: _events[i].event.type,
          description: _events[i].event.targetDOMPath
        });
      }
    }

    console.log('getEventPlotData time: ', performance.now() - test);

    return data;
  }
}