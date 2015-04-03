'use strict';

// Mapping of the connections between the devtools and the tabs
var connections = {};

// Handles connections
chrome.runtime.onConnect.addListener(function(port){

  /**
   * Listener for the devtools panel messages.
   *
   * @param {Object}        message       message sent from the devtools
   * @param {Object}        message.task  task to execute
   */
  var devToolsListener = function(message){

    switch (message.task){
      case 'init':
        console.log('Dev Tools listener initialized '+message.tabId);
        connections[message.tabId] = port;
        break;
      case 'log':
        console.log('devtools.js - ' + message.text, message.obj);
        break;
      case 'injectContentScript':
        console.log('devtools.js - Injecting content script');
        chrome.tabs.executeScript(message.tabId, {
          file: 'src/injected/inspector.js',
        });
        break;
      default:
        console.log('devtools.js - Received unknown task: ' + message.task);
    }
    return true;
  };

  /**
   * Listener for the content Script.
   *
   * @param {Object}        message       message sent from the devtools
   * @param {Object}        message.task  task to execute
   * @param {MessageSender} sender        sender
   */
  var contentScriptListener = function(message, sender){

    if(message.task === 'log'){
      console.log('content-script.js - '+ message.text, message.obj);
      return;
    }

    if (sender.tab) {
      console.log('Received content Script message', message);
      var tabId = sender.tab.id;
      if (tabId in connections) {
        connections[tabId].postMessage(message);
      } else {
        console.log('background.js - Tab not found in connection list.');
      }
    } else {
      console.log('background.js - sender.tab not defined.');
    }
    return true;
  };

  if (port.name === 'devtools-page'){

    console.log('background.js - devtools listener setup');

    // add the listener
    port.onMessage.addListener(devToolsListener);

    // Removes the listener on disconnection and cleans up connections
    port.onDisconnect.addListener(function() {
      port.onMessage.removeListener(devToolsListener);

      var tabs = Object.keys(connections);
      for (var i=0, len=tabs.length; i < len; i++) {
        if (connections[tabs[i]] == port) {
          delete connections[tabs[i]];
          break;
        }
      }
    });
  } else if (port.name === 'content-script'){

    console.log('background.js - content script listener setup');
    port.onMessage.addListener(contentScriptListener);

    port.onDisconnect.addListener(function(){
      port.onMessage.removeListener(contentScriptListener);
    });
  }
});
