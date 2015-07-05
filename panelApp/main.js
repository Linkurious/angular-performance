'use strict';

// Browserify isolates loaded modules, dependencies need jquery as global
window.jQuery = window.$ = require('jquery');

var _ = require('lodash');

var
  ServicePanelCtrl = require('./panels/servicePanelController'),
  Registry = require('./models/registry'),
  TabsHandler = require('./tabHandler'),
  Plots = require('./panels/plots'),
  InstantMetrics = require('./panels/instantMetrics'),
  SettingsPanelCtrl = require('./panels/settingsPanelController'),
  backgroundPageConnection = chrome.runtime.connect({
    name: "angular-performance-panel"
  });

var
  registry = new Registry(),
  servicePanelCtrl = new ServicePanelCtrl(backgroundPageConnection, registry);

// Initialize all services with the registry (should be a singleton)
InstantMetrics.initRegistry(registry);
Plots.initRegistry(registry);

var
  tabs = new TabsHandler(Plots),
  // For now the reference of the settings is not used by the other services but it could in the future.
  settingsPanelCtrl = new SettingsPanelCtrl(registry, Plots, tabs);

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
      registry.registerWatcherCount(message.data.timestamp, message.data.watcher);
      break;
    case 'registerSyncServiceFunctionCall':
      registry.registerSyncExecution(message.data);
      servicePanelCtrl.refreshModulePanels();
      break;
    case 'registerASyncServiceFunctionCall':
      registry.registerASyncExecution(message.data);
      servicePanelCtrl.refreshModulePanels();
      break;
    case 'reportModuleExistence':
      servicePanelCtrl.printModuleNameCheck(message.data.moduleName, message.data.services);
      break;
    default:
      console.log('Unknown task ', message);
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
  },
  {
    id: 'watchers-count-chart',
    eventTimelineId: 'watchers-event-timeline',
    rangeSliderId: 'watchers-range-slider',
    plotName: 'Watchers count',
    dataFunction: registry.getWatchersCountPlotData,
    pauseButton: '#pauseWatchersCount',
    liveButton: '#liveWatchersCount',
    live: true
  },
  {
    id: 'watcher-count-distribution-chart',
    rangeSliderId: 'watcher-count-distribution-range-slider',
    plotName: 'Watcher Count distribution',
    dataFunction: registry.getWatchersCountDistributionPlotData,
    renderer: 'bar',
    xAxis: 'numerical',
    live: true,
    callback: function(){
      $('#id-location-table').empty();
      var locationMap = registry.getLocationMap();

      _.forEach(Object.keys(locationMap), function(location){
        $('#id-location-table').append('<tr><td>'+ locationMap[location] +'</td><td>'+ location +'</td></tr>');
      });
    }
  }
]);

Plots.buildMainPlots();
tabs.bindTabs();



