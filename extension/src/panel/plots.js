'use strict';

var UPDATE_INTERVAL = 1000;

var digestTimePlot = $.plot('#digest-time-chart', registry.getDigestTimingPlotData(), {
  series: {
    shadowSize: 0	// Drawing is faster without shadows
  },
  yaxis: {
    min: 0,
    max: 100
  },
  xaxis: {
    show: false
  }
});

function updateDigestTimePlot(){

  var data = registry.getDigestTimingPlotData();

  log('data:', data);

  digestTimePlot.setData([data]);
  digestTimePlot.draw();
  setTimeout(updateDigestTimePlot, UPDATE_INTERVAL);
}

updateDigestTimePlot();