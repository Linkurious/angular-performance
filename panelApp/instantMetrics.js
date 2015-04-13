'use strict';

var
  $ = require('jquery');

var
  instantMetrics = {},
  _registry = null,
  _REFRESH_RATE = 300,
  _digestCountTimeout = null;

/**
 * Initializes the registry reference.
 *
 * @param registry
 */
instantMetrics.initRegistry = function(registry){
  _registry = registry;
};

/**
 * Updates the panel with the last digest length
 *
 * @param {Number} time - time of the digest in ms
 */
instantMetrics.updateDigestTiming = function(time){
  $('#instantDigestTime').text(Math.ceil(time));
};

/**
 * Updates the panel with the last secon
 */
instantMetrics.updateDigestCount = function(){
  $('#instantDigestRate').text(_registry.getLastSecondDigestCount());
};

/**
 * Gets the digest count every _REFRESH_RATE seconds
 */
instantMetrics.listenToDigestCount = function(){
  instantMetrics.updateDigestCount();
  _digestCountTimeout = setTimeout(instantMetrics.listenToDigestCount, _REFRESH_RATE);
};

module.exports = instantMetrics;