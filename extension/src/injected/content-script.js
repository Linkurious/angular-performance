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
  backgroundPageConnection.postMessage({
    task: 'log',
    text: message,
    obj: obj
  });
}

log('Content Script loaded');

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.task) {
    log("Content script received: " + event.data.text);
    backgroundPageConnection.postMessage(event.data);
  }
}, false);

// Add injected script to the page
var script = document.createElement('script');
script.type = "text/javascript";
script.src = chrome.extension.getURL("src/injected/inspector.js");

if (document.body) {
  document.body.appendChild(script);
}
