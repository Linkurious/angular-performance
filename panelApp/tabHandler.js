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

  var
    _TABS = {
      HOME: 'homeTab',
      SCOPE: 'scopeTab',
      TIMING: 'detailTimingTab'
    },

    _plots = plots,
    _currentTab = _TABS.HOME;

  /**
   * This method allows navigation through tabs in the panel.
   *
   * @param {String} tabName - name of the tab to go to.
   */
  self.goToTab = function(tabName){

    if (tabName === _currentTab ){
      return;
    }
    if (tabName !== _TABS.HOME && tabName !== _TABS.SCOPE && tabName !== _TABS.TIMING) {
      throw new Error('tabHandler.js - Unrecognized tab name');
    }

    if (_currentTab === _TABS.HOME){
      _plots.stopMainPlotRendering();
    }

    $('#' + _currentTab).hide();
    $('#' + _currentTab + 'Button').removeClass('active');
    $('#' + tabName).show();
    $('#' + tabName + 'Button').addClass('active');

    if (tabName === _TABS.HOME){
      _plots.startMainPlotRendering();
    }

    _currentTab = tabName;
  };

  /**
   * Binds the tabs to the the click listeners.
   */
  self.bindTabs = function(){
    _.forEach(Object.keys(_TABS), function(TAB){
      $('#' + _TABS[TAB] + 'Button').click(function(){
        self.goToTab(_TABS[TAB]);
      })
    });
  };
}

module.exports = tabHandler;
