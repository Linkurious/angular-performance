'use strict';

// Browserify isolates loaded modules, dependencies need jquery as global
window.jQuery = window.$ = require('jquery');

var
  Registry = require('./registry'),
  Plots = require('./plots'),
  InstantMetrics = require('./instantMetrics'),
  backgroundPageConnection = chrome.runtime.connect({
    name: "angular-performance-panel"
  });

var registry = new Registry();

// Initialize all services with the registry (should be a singleton)
InstantMetrics.initRegistry(registry);
Plots.initRegistry(registry);

// Listen to the message sent by the injected script
backgroundPageConnection.onMessage.addListener(function(message){

  switch(message.task){
    case 'registerDigestTiming':
      InstantMetrics.updateDigestTiming(message.data.time);
      registry.registerDigestTiming(message.data.timestamp, message.data.time);
      break;
    case 'registerEvent':
      registry.registerEvent(message.data.timestamp, message.data.event);
      break;
    case 'registerRootWatcherCount':
      InstantMetrics.updateWatcherCount(message.data.watcher.watcherCount);
      break;
    default:
      log('Unknown task ', message.task);
      break;
  }
});

// The panel is initialized, send reference for message dispatch
backgroundPageConnection.postMessage({
  task: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

// Set up the timed retrieval of digest count
InstantMetrics.listenToDigestCount(registry);

// Set up plots of the main tab
Plots.setMainPlotsSettings([
  {
    id: 'digest-time-chart',
    eventTimelineId: 'digest-time-event-timeline',
    rangeSliderId: 'digest-time-range-slider',
    plotName: 'Digest time length',
    dataFunction: registry.getDigestTimingPlotData,
    pauseButton: '#pauseDigestTime',
    liveButton: '#liveDigestTime',
    live: true
  },
  {
    id: 'digest-rate-chart',
    eventTimelineId: 'digest-rate-event-timeline',
    rangeSliderId: 'digest-rate-range-slider',
    plotName: 'Digest count',
    dataFunction: registry.getDigestRatePlotData,
    pauseButton: '#pauseDigestCount',
    liveButton: '#liveDigestCount',
    live: true
  },
  {
    id: 'digest-time-distribution-chart',
    rangeSliderId: 'digest-time-distribution-range-slider',
    plotName: 'Digest time distribution',
    dataFunction: registry.getDigestTimeDistributionPlotData,
    renderer: 'bar',
    xAxis: 'numerical',
    live: true
  }
]);

Plots.buildMainPlots(registry);



