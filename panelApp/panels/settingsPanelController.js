'use strict';

var
  $ = require('jquery');

function SettingsPanelCtrl(registry, plots, tabs){

  $('#clearDataButton').click(function(){
    registry.clearData();
    plots.clearAnnotations();
    tabs.goToTab(tabs.TABS.HOME);
  });
}

module.exports = SettingsPanelCtrl;
