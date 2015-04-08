'use strict';

var UPDATE_INTERVAL = 1000;

var digestTimePlot = $.plot('#digest-time-chart', registry.getDigestTimingPlotData(), {
  series: {
    shadowSize: 0	// Drawing is faster without shadows
  },
  xaxis: {
    mode: 'time'
  }
});


function updateDigestTimePlot(){

  var data = registry.getDigestTimingPlotData();

  digestTimePlot.setData([data]);
  digestTimePlot.setupGrid();
  digestTimePlot.draw();

  setTimeout(updateDigestTimePlot, UPDATE_INTERVAL);

}

updateDigestTimePlot();