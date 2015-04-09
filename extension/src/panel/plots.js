'use strict';

var
  UPDATE_INTERVAL = 1000,
  EVENT_TYPES = [
    {
      eventType: "MOUSE_EVENT",
      color: "red",
      position: 'BOTTOM'
    }, {
      eventType: "TOUCH_EVENT",
      color: "orange",
      position: 'BOTTOM'
    }, {
      eventType: "KEYBOARD_EVENT",
      color: "blue",
      position: 'TOP'
    }, {
      eventType: "CONTROL_EVENT",
      color: "green",
      position: 'TOP'
    }
  ],
  // Declare plots
  plots = [
    {
      id: '#digest-time-chart',
      dataFunction: registry.getDigestTimingPlotData,
      pauseButton: '#pauseDigestTime',
      liveButton: '#liveDigestTime',
      live: true
    },
    {
      id: '#digest-frequency-number-chart',
      dataFunction: registry.getDigestRatePlotData,
      pauseButton: '#pauseDigestCount',
      liveButton: '#liveDigestCount',
      live: true
    }];

// Execute plots
_.forEach(plots, function(plot){

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

  var data = plot.dataFunction();

  plot.instance = $.plot(plot.id, [data], {
    series: {
      shadowSize: 0	// Drawing is faster without shadows
    },
    events: {
      data: registry.getEventPlotData(data),
      types: EVENT_TYPES
    },
    xaxis: {
      mode: 'time'
    },
    grid: {
      hoverable: true
    }
  });

  plot.updateFunction = function(){

    var
      data = plot.dataFunction(),
      events = registry.getEventPlotData(data);

    console.log(plot.id+' event count: ', events.length);

    plot.instance.setData([data]);
    plot.instance.setEvents(events);

    var ref = performance.now();

    plot.instance.setupGrid();
    plot.instance.draw();

    console.log(plot.id+' draw time (grid+draw): ', performance.now() - ref);

    if (plot.live) {
      setTimeout(plot.updateFunction, UPDATE_INTERVAL);
    }
  };

  plot.updateFunction();
});