'use strict';

/*
    This content script is injected only when the devtools are opened
 */

var
  USER_EVENTS = [
    'mousedown',
    'mouseup',
    'click',
    'dblclick',
    //Mouse move event id too chatty
    //'mousemove',
    'mouseover',
    'mouseout',
    'mousewheel',

    'keydown',
    'keyup',
    'keypress',
    'textInput',

    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',

    'resize',
    'scroll',
    'zoom',
    'focus',
    'blur',
    'select',
    'change',
    'submit',
    'reset'
  ];

var backgroundPageConnection = chrome.runtime.connect({
  name: 'content-script'
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

/**
 * Gets the XPath of an element
 *
 * @param {Node} element - Dom element
 * @returns {string} - XPath
 */
function generateXPath(element) {
  if (element.id !== ''){
    return 'id("' + element.id + '")';
  }
  if (element === document.body) {
    return element.tagName;
  }

  var ix= 0;
  var siblings= element.parentNode.childNodes;

  for (var i = 0 ; i<siblings.length ; i++) {
    var sibling = siblings[i];
    if (sibling === element) {
      return generateXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}

log('Content Script loaded');

// Listen for messages from the current page and send then to the background script for dispatch
window.addEventListener('message', function(event) {

  // We only accept messages from ourselves
  if (event.source != window)
    return;

  var message = event.data;

  if (typeof message !== 'object' || message === null || message.source !== 'angular-performance') {
    return;
  }

  backgroundPageConnection.postMessage(message);
}, false);

// Add Listeners for all user events to that they can be captured
USER_EVENTS.forEach(function(eventType){
  document.addEventListener(eventType, function(event){
    backgroundPageConnection.postMessage({
      source: 'angular-performance',
      task: 'registerEvent',
      data: {
        timestamp: Date.now(),
        event: {
          type: event.type,
          targetDOMPath: generateXPath(event.target)
        }
      }
    });
  });
});


// Add injected script to the page
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.extension.getURL('src/injected/inspector.js');
document.head.appendChild(script);



