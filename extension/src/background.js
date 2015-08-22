'use strict';

// Mapping of the connections between the devtools and the tabs
var
  contentScriptConnections = {},
  devToolsConnections = {},
  panelConnections = {};

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
        console.log('Background - Dev Tools listener initialized ' + message.tabId);
        devToolsConnections[message.tabId] = port;
        if (contentScriptConnections[message.tabId]){
          contentScriptConnections[message.tabId].postMessage({
            task: 'addInspector'
          });
        }
        break;
      case 'log':
        if (message.obj) {
          console.log('Devtools - ' + message.text, message.obj);
        } else {
          console.log('Devtools - ' + message.text);
        }
        break;
      default:
        console.log('Background - Devtools listener received an unknown task: ' + message.task);
    }
    return true;
  };

  /**
   * Listener for the content Script.
   *
   * @param {Object}        message       message sent from the devtools
   * @param {Object}        message.task  task to execute
   * @param {Port}          port          port
   */
  var contentScriptListener = function(message, port){

    var sender = port.sender;

    if(message.task === 'log'){
      if (message.obj) {
        console.log('Content-script - ' + message.text, message.obj);
      } else {
        console.log('Content-script - ' + message.text);
      }
      return;
    }

    if (sender.tab) {

      var tabId = sender.tab.id;

      if (message.task === 'initDevToolPanel' && devToolsConnections[tabId]) {
        devToolsConnections[tabId].postMessage(message);
      } else if (message.task === 'checkDevToolsStatus' && devToolsConnections[tabId]) {
        contentScriptConnections[tabId].postMessage({
          task: 'addInspector'
        });
      } else if (tabId in panelConnections) {
        panelConnections[tabId].postMessage(message);
      } else {
        //console.log('background.js - Tab not found in connection list.', sender.tab.id, panelConnections);
      }
    } else {
      console.log('Background - sender.tab not defined.');
    }
    return true;
  };

  /**
   * Listener for the panel inserted in the devtools (we cannot communicate directly between the
   * devtool page and the panel (weird)
   *
   * @param {Object} message
   */
  var panelListener = function(message){
    if (message.task === 'init'){
      console.log('Background - Panel listener initialized ', message.tabId);
      panelConnections[message.tabId] = port

    } else if (message.task === 'sendTaskToInspector') {
      contentScriptConnections[message.tabId].postMessage(message.data)

    } else if (message.task === 'log'){
      if (message.obj) {
        console.log('Panel - ' + message.text, message.obj);
      } else {
        console.log('Panel - ' + message.text);
      }
    }
  };

  /*
      Bindings
   */

  if (port.name === 'devtools-page'){
    console.log('Background - Devtools listener setup');

    // add the listener
    port.onMessage.addListener(devToolsListener);

    // Removes the listener on disconnection and cleans up connections
    port.onDisconnect.addListener(function() {
      port.onMessage.removeListener(devToolsListener);

      var tabs = Object.keys(devToolsConnections);
      for (var i=0, len=tabs.length; i < len; i++) {
        if (devToolsConnections[tabs[i]] == port) {
          delete devToolsConnections[tabs[i]];
          break;
        }
      }
    });


  } else if (port.name === 'content-script'){

    console.log('Background - content script listener setup');
    port.onMessage.addListener(contentScriptListener);

    // If the devtools are already opened for this tab, and this is the content-script has just been injected
    // we also want to add the inspector to the page
    if (port.sender){
      contentScriptConnections[port.sender.tab.id] = port;
    }

    port.onDisconnect.addListener(function(){
      port.onMessage.removeListener(contentScriptListener);

      var tabs = Object.keys(contentScriptConnections);
      for (var i=0, len=tabs.length; i < len; i++) {
        if (contentScriptConnections[tabs[i]] == port) {
          delete contentScriptConnections[tabs[i]];
          break;
        }
      }
    });


  } else if (port.name === 'angular-performance-panel'){

    port.onMessage.addListener(panelListener);

    // Removes the listener on disconnection and cleans up connections
    port.onDisconnect.addListener(function() {
      port.onMessage.removeListener(panelListener);

      var tabs = Object.keys(panelConnections);
      for (var i = 0, len = tabs.length; i < len ; i++) {
        if (panelConnections[tabs[i]] == port) {
          delete panelConnections[tabs[i]];
          // On panel closing, clean up the tab from all wrapped functions and removes the injector.js
          contentScriptConnections[tabs[i]].postMessage({
            task: 'cleanUpInspectedApp'
          });
          break;
        }
      }
    });
  }
});
