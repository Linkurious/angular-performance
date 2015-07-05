'use strict';

var $ = require('jquery');
var _ = require('lodash');

/**
 * This module handles the change between the panel tabs.
 * It both handles showing/hiding elements and stopping rendering when not necessary.
 *
 * @param {Object} plots - Plot object of the panel app.
 */
function tabHandler(plots){

  var self = this;


  self.TABS = {
      HOME: 'homeTab',
      SCOPE: 'scopeTab',
      TIMING: 'detailTimingTab',
      SETTINGS: 'settingsTab'
    };

  var
    _plots = plots,
    _currentTab = self.TABS.HOME;

  /**
   * This method allows navigation through tabs in the panel.
   *
   * @param {String} tabName - name of the tab to go to.
   */
  self.goToTab = function(tabName){

    if (tabName === _currentTab ){
      return;
    }
    if (!_.includes(_.values(self.TABS), tabName)) {
      throw new Error('tabHandler.js - Unrecognized tab name');
    }

    if (_currentTab === self.TABS.HOME){
      _plots.stopMainPlotRendering();
    }

    $('#' + _currentTab).hide();
    $('#' + _currentTab + 'Button').removeClass('active');
    $('#' + tabName).show();
    $('#' + tabName + 'Button').addClass('active');

    if (tabName === self.TABS.HOME){
      _plots.startMainPlotRendering();
    }

    _currentTab = tabName;
  };

  /**
   * Binds the tabs to the the click listeners.
   */
  self.bindTabs = function(){
    _.forEach(Object.keys(self.TABS), function(TAB){
      $('#' + self.TABS[TAB] + 'Button').click(function(){
        self.goToTab(self.TABS[TAB]);
      })
    });
  };
}

module.exports = tabHandler;
