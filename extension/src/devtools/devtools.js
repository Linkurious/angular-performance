'use strict';

// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect({
  name: "devtools-page"
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

backgroundPageConnection.onMessage.addListener(function (message) {

  if (message.task === 'initDevToolPanel'){
    log('building panel');
    chrome.devtools.panels.create(
      'Angular',
      'images/AngularJS-Shield-small.png',
      'src/panel/panel.html'
    );
    backgroundPageConnection.disconnect();
  } else {
    log('Unknown task ', message.task);
  }
});

// Initialize the connection Array for the current tab in the background script
backgroundPageConnection.postMessage({
  task: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

backgroundPageConnection.postMessage({
  task: 'injectContentScript',
  tabId: chrome.devtools.inspectedWindow.tabId
});