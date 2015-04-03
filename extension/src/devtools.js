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
  backgroundPageConnection.postMessage({
    task: 'log',
    text: message,
    obj: obj
  });
}

backgroundPageConnection.onMessage.addListener(function (message) {

  log('message received', message);

  switch (message.task){
    case 'initDevToolPanel':
      buildAngularPanel();
      break;
    default:
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
  tabId: chrome.devtools.inspectedWindow.tabId,
});

/**
 * Builds the angular panel in the chrome devtools
 */
function buildAngularPanel(){
  log('building panel');
  chrome.devtools.panels.create(
    'Angular',
    'images/AngularJS-Shield-small.png',
    'panel/panel.html'
  );
}