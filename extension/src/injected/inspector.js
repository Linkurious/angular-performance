/*
 File that will be injected in the page by the content script in order to retrieve angular
 performance metrics.
 */
(function() {
  'use strict';
  console.log('angular-performance - Inspector loaded into webpage');

  if (document.readyState === 'complete'){
    console.log('ready state complete');
    inspector();
  } else {
    console.log('ready state not complete');
    window.onload(inspector)
  }

  function inspector(){
    console.log('Sending devtools init message');
    window.postMessage({
      task: 'initDevToolPanel',
      source: 'angular-performance'
    }, '*');
  }
})();