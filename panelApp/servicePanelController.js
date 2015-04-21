'use strict';

var
  _ = require('lodash'),
  $ = require('jquery');

/**
 * Controller used for the Service panel. It directly modifies the interface
 *
 * @param {Port} pageConnection - direct connection to the background script
 * @constructor
 */
function ServicePanelController (pageConnection){

  var
    self = this,

    _newModuleNameInput = $('#module-name'),
    _newModuleServices = $('#module-services');

  // We want to check if the module name is correct only when the user has finished typing.
  // We consider this to be when he has stopped for more than 300ms.
  _newModuleNameInput.keyup(_.debounce(function(){
    console.log('sending message to background');
    pageConnection.postMessage({
      task: 'sendTaskToInspector',
      tabId: chrome.devtools.inspectedWindow.tabId,
      data: {
        task: 'checkModuleName',
        moduleName: _newModuleNameInput.val()
      }
    });
  }, 300));

  /**
   * Prints into the modal if the module name is correct or not. Along with that, it also prints
   * the list of services that are required by that module.
   *
   * @param {String[]} [services] - list of services defined by the module. If undefined, it means
   *                                that the module does not exist.
   */
  self.printModuleNameCheck = function(services){

    var parent = _newModuleNameInput.parent();

    if (services){
      parent.removeClass('has-error');
      $('#addModuleModalApplyButton').removeAttr('disabled');
      parent.addClass('has-success');

      _newModuleServices.empty();

      var ul = $('<ul></ul>');
      _.forEach(services.sort(), function(service){
        ul.append('<li>' + service + '</li>');
      });

      _newModuleServices.append(ul);
    } else {
      parent.removeClass('has-success');
      parent.addClass('has-error');
      $('#addModuleModalApplyButton').attr('disabled', true);
      _newModuleServices
        .empty()
        .append('<p>The Module name is incorrect</p>');
    }
  }
}

module.exports = ServicePanelController;