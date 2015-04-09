'use strict';

var
  UPDATE_INTERVAL = 1000,
  palette = new Rickshaw.Color.Palette( { scheme: 'classic9' }),
  // Declare plots
  plots = [
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
    }];

// Execute plots
_.forEach(plots, function(plot){

  // Controls of the start en end date
  $(plot.liveButton).click(function(){
    plot.live = true;
    $(plot.pauseButton).removeClass('active');
    $(plot.liveButton).addClass('active');
    plot.updateFunction();
  });

  $(plot.pauseButton).click(function(){
    plot.live = false;
    $(plot.liveButton).removeClass('active');
    $(plot.pauseButton).addClass('active');
  });

  // Graph instantiation
  plot.instance = new Rickshaw.Graph({
    element: document.getElementById(plot.id),
    renderer: 'line',
    stroke: true,
    preserve: true,
    series: [
      {
        color: palette.color(),
        data:  plot.dataFunction(),
        name: plot.plotName
      }
    ]
  });

  plot.slider = new Rickshaw.Graph.RangeSlider.Preview({
    graph: plot.instance,
    element: document.getElementById(plot.rangeSliderId)
  });

  plot.instance.render();

  plot.annotator = new Rickshaw.Graph.Annotate( {
    graph: plot.instance,
    element: document.getElementById(plot.eventTimelineId)
  });

  plot.xAxis = new Rickshaw.Graph.Axis.Time( {
    graph: plot.instance,
    timeFixture: new Rickshaw.Fixtures.Time.Local()
  });

  plot.xAxis.render();

  plot.yAxis = new Rickshaw.Graph.Axis.Y( {
    graph: plot.instance,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  });

  plot.yAxis.render();

  plot.updateFunction = function(){

    _.forEach(registry.getLastEventAnnotatorData(plot.id), function(event){
      plot.annotator.add(event.timestamp, event.message);
    });
    plot.annotator.update();
    plot.dataFunction();
    plot.instance.update();

    if (plot.live) {
      setTimeout(plot.updateFunction, UPDATE_INTERVAL);
    }
  };

  plot.updateFunction();
});