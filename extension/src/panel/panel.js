'use strict';

var backgroundPageConnection = chrome.runtime.connect({
  name: "angular-performance-panel"
});

/**
 * Proxy to be used to send log messages to the background script fom where they can be read.
 *
 * @param {String} message - Message to be printed into the background.js console
 * @param {Object} [obj]     - Object to log into the console.
 */
function log(message, obj){
  var logMessage = {
    task: 'log',
    text: message
  };

  if (!!obj){
    logMessage.obj = obj;
  }

  backgroundPageConnection.postMessage(logMessage);
}

var registry = new Registry();

backgroundPageConnection.onMessage.addListener(function(message){

  switch(message.task){
    case 'registerDigestTiming':
      updateDigestTimingInstantMetric(message.data.time);
      registry.registerDigestTiming(message.data.start, message.data.time);
      break;
    default:
      log('Unknown task ', message.task);
      break;
  }
});

backgroundPageConnection.postMessage({
  task: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

/**
 * Updates the panel with the last digest length
 *
 * @param {Number} time - time of the digest in ms
 */
function updateDigestTimingInstantMetric(time){
  $('#digestTimeInstant').text(Math.round(time));
}

var digestRateInterval = setInterval(function(){
  $('#instantDigestRate').text(registry.getLastSecondDigestCount());
}, 300);

