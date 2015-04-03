/*
 File that will be injected in the page by the content script in order to retrieve angular
 performance metrics.
 */
(function() {
  'use strict';
  console.log('angular-performance - Inspector loaded into webpage');

  if (document.readyState === 'complete'){
    console.log('reqdy state complete');
    inspector();
  } else {
    console.log('ready state not complete');
    window.onload(inspector)
  }


  function inspector(){
    console.log(typeof window.angular);
    if (typeof angular != 'undefined') {
      console.log('angular-performance - Angular found');
      window.postMessage({
        task: 'initDevToolPanel'
      });
    }
  }
})();