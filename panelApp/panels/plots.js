'use strict';

var Rickshaw = require('rickshaw');
var $ = require('jquery');
var _ = require('lodash');

require('jquery-ui');

var
  _UPDATE_INTERVAL = 1000,
  _COLOR_PALETTE = new Rickshaw.Color.Palette( { scheme: 'classic9' }),

  _registry = null,
  _mainPlotsSettings = [],

  Plots = {};

/**
 * Initializes the registry reference.
 *
 * @param {Object} registry - registry object of the app. This should be the current instance reference.
 */
Plots.initRegistry = function(registry){
  _registry = registry;
};

/**
 * Sets the different plots of the panel
 *
 * @param {Object[]} settingsArray - Array of settings
 */
Plots.setMainPlotsSettings = function(settingsArray){
  _mainPlotsSettings = settingsArray;
};

/**
 * Stops the main plots rendering to spare to computing resources
 */
Plots.stopMainPlotRendering = function(){
  _.forEach(_mainPlotsSettings, function(plot){
    plot.live = false;
  });
};

/**
 * Turns on auto-refresh on the main plots.
 */
Plots.startMainPlotRendering = function(){
  _.forEach(_mainPlotsSettings, function(plot){
    plot.live = true;
    plot.updateFunction();
  })
};

/**
 * Builds the plots on the main page
 */
Plots.buildMainPlots = function(){

  _.forEach(_mainPlotsSettings, function(plot){

    $('#' + plot.id).empty();

    if (plot.eventTimelineId) {
      $('#' + plot.eventTimelineId).empty();
    }
    if (plot.rangeSliderId) {
      $('#' + plot.rangeSliderId).empty();
    }


    // Controls of the start en end date
    if (plot.pauseButton && plot.liveButton) {
      $(plot.liveButton).unbind();
      $(plot.pauseButton).unbind();

      $(plot.liveButton).click(function () {
        plot.live = true;
        $(plot.pauseButton).removeClass('active');
        $(plot.liveButton).addClass('active');
        plot.updateFunction();
      });

      $(plot.pauseButton).click(function () {
        plot.live = false;
        $(plot.liveButton).removeClass('active');
        $(plot.pauseButton).addClass('active');
      });
    }

    // Controls for export as image
    if (plot.exportButton){
      $(plot.exportButton).unbind();

      $(plot.exportButton).click(function(){
        Plots.downloadSVG(plot.id, plot.plotName);
      })
    }

    // Graph instantiation
    plot.instance = new Rickshaw.Graph({
      element: document.getElementById(plot.id),
      renderer: (plot.renderer) ? plot.renderer : 'line',
      stroke: true,
      preserve: true,
      series: [
        {
          color: _COLOR_PALETTE.color(),
          data: plot.dataFunction(),
          name: plot.plotName
        }
      ]
    });

    plot.slider = new Rickshaw.Graph.RangeSlider.Preview({
      graph: plot.instance,
      element: document.getElementById(plot.rangeSliderId)
    });

    plot.instance.render();

    if (plot.eventTimelineId) {
      plot.annotator = new Rickshaw.Graph.Annotate({
        graph: plot.instance,
        element: document.getElementById(plot.eventTimelineId)
      });
    }

    if (!plot.xAxis) {
      plot.xAxis = new Rickshaw.Graph.Axis.Time({
        graph: plot.instance,
        timeFixture: new Rickshaw.Fixtures.Time.Local()
      });
    } else {
      plot.xAxis = new Rickshaw.Graph.Axis.X( {
        graph: plot.instance
      });
    }

    plot.xAxis.render();

    plot.yAxis = new Rickshaw.Graph.Axis.Y( {
      graph: plot.instance,
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT
    });

    plot.yAxis.render();

    plot.updateFunction = function(){

      if (plot.eventTimelineId) {
        _.forEach(_registry.getLastEventAnnotatorData(plot.id), function (event) {
          plot.annotator.add(event.timestamp, event.message);
        });
        plot.annotator.update();
      }
      plot.dataFunction();
      plot.instance.update();

      if (plot.callback){
        plot.callback();
      }

      if (plot.live) {
        setTimeout(plot.updateFunction, _UPDATE_INTERVAL);
      }
    };

    plot.updateFunction();
  });
};

/**
 * Cleans up annotations registered in the event bar .
 */
Plots.clearAnnotations = function(){
  _.forEach(_mainPlotsSettings, function(plot){
    if (plot.annotator) {
      _.forEach(Object.keys(plot.annotator.data), function(timestamp){
        delete plot.annotator.data[timestamp];
      })
    }
  });

  $('.annotation').remove();
};


Plots.downloadSVG = function(divId, title){

  var
    source = getSource(document.getElementById(divId)),
    url = window.URL.createObjectURL(new Blob(source.source, { "type" : "text\/xml" })),
    a = document.createElement("a");

  a.setAttribute("class", "svg-crowbar");
  a.setAttribute("download", title + ".svg");
  a.setAttribute("href", url);
  a.click();

  setTimeout(function() {
    window.URL.revokeObjectURL(url);
  }, 10);
};

function getSource(node) {

  var
    prefix = {
      xmlns: "http://www.w3.org/2000/xmlns/",
      xlink: "http://www.w3.org/1999/xlink",
      svg: "http://www.w3.org/2000/svg"
    },
    doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    svg = node.firstElementChild,
    emptySvg = window.document.createElementNS(prefix.svg, 'svg');

  window.document.body.appendChild(emptySvg);
  var emptySvgDeclarationComputed = getComputedStyle(emptySvg);

  svg.setAttribute("version", "1.1");

  // removing attributes so they aren't doubled up
  svg.removeAttribute("xmlns");
  svg.removeAttribute("xlink");

  // These are needed for the svg
  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
  }

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
  }

  setInlineStyles(svg, emptySvgDeclarationComputed);

  var source = (new XMLSerializer()).serializeToString(svg);
  var rect = svg.getBoundingClientRect();

  window.document.body.removeChild(emptySvg);

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    class: svg.getAttribute("class"),
    id: svg.getAttribute("id"),
    childElementCount: svg.childElementCount,
    source: [doctype + source]
  };
}

function setInlineStyles(svg, emptySvgDeclarationComputed) {

  function explicitlySetStyle (element) {
    var cSSStyleDeclarationComputed = getComputedStyle(element);
    var i, len, key, value;
    var computedStyleStr = "";
    for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
      key=cSSStyleDeclarationComputed[i];
      value=cSSStyleDeclarationComputed.getPropertyValue(key);
      if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
        computedStyleStr+=key+":"+value+";";
      }
    }
    element.setAttribute('style', computedStyleStr);
  }

  function traverse(obj){
    var tree = [];
    tree.push(obj);
    visit(obj);
    function visit(node) {
      if (node && node.hasChildNodes()) {
        var child = node.firstChild;
        while (child) {
          if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
            tree.push(child);
            visit(child);
          }
          child = child.nextSibling;
        }
      }
    }
    return tree;
  }
  // hardcode computed css styles inside svg
  var allElements = traverse(svg);
  var i = allElements.length;
  while (i--){
    explicitlySetStyle(allElements[i]);
  }
}

module.exports = Plots;
