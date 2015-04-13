'use strict';


window.jQuery = window.$ = require('jquery');

var
  Registry = require('./registry'),
  Plots = require('./plots'),
  InstantMetrics = require('./instantMetrics'),
  backgroundPageConnection = chrome.runtime.connect({
    name: "angular-performance-panel"
  });

var registry = new Registry();

InstantMetrics.initRegistry(registry);
Plots.initRegistry(registry);

backgroundPageConnection.onMessage.addListener(function(message){

  switch(message.task){
    case 'registerDigestTiming':
      InstantMetrics.updateDigestTiming(message.data.time);
      registry.registerDigestTiming(message.data.timestamp, message.data.time);
      break;
    case 'registerEvent':
      registry.registerEvent(message.data.timestamp, message.data.event);
      break;
    default:
      log('Unknown task ', message.task);
      break;
  }
});

backgroundPageConnection.postMessage({
  task: 'init',
  tabId: chrome.devtools.inspectedWindow.tabId
});

InstantMetrics.listenToDigestCount(registry);

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



