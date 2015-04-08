'use strict';

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
    _digestTiming = [];

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
      now = performance.now(),
      count = 0;

    // We go through the digest timing array from the most recent to the least recent entry. We stop
    // when the time difference between now and the entry exceeds 500ms.
    for (var i = _digestTiming.length - 1 ; i > -1 && _digestTiming[i].timestamp > now - 500 ; i--){
      count++;
    }

    return count * 2;
  }
}