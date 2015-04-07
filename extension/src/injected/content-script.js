'use strict';

var backgroundPageConnection = chrome.runtime.connect({
  name: "content-script"
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

log('Content Script loaded');

window.addEventListener('message', function(event) {


  // We only accept messages from ourselves
  if (event.source != window)
    return;

  var message = event.data;

  if (typeof message !== 'object' || message === null || message.source !== 'angular-performance') {
    return;
  }

  log("Content script received", message);
  backgroundPageConnection.postMessage(message);
}, false);

// Add injected script to the page
var script = document.createElement('script');
script.type = "text/javascript";
script.src = chrome.extension.getURL("src/injected/inspector.js");
document.head.appendChild(script);



