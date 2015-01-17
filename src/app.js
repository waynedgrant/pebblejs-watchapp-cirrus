// Copyright 2015 Wayne D Grant (www.waynedgrant.com)
// Licensed under the MIT License

var ajax = require('ajax');
var Settings = require('settings');
var UI = require('ui');

var weatherUrl = null;
var units = null;

var degreesC = '\u00B0C';
var degreesF = '\u00B0F';

var configRequiredCard = new UI.Card({
  title: 'Configuration Required',
  body: 'Configure settings for Cirrus using the Pebble phone app'
});

var fetchingCard = new UI.Card({
  title: 'Fetching Weather...'
});

var fetchFailedCard = new UI.Card({
  title: 'Fetch Failed',
  body: 'Check connection and Web Service URL'
});

var mainMenu = null;

Settings.config(
  { url: 'http://www.waynedgrant.com/pebblejs-watchapp-cirrus/settings.html' },
  function(e) { // Settings page closed
    configRequiredCard.hide();
    fetchFailedCard.hide();
    if (e.options.weatherUrl != null) { // Settings page not canceled
        get_weather();
    }
  }
);

function format(value) {
  if (value === null) {
    value = '-';
  }
  return value;
}

function format_trend(trend) {
  var trend_char = '-';

  if (trend !== null) {
    if (trend > 0) {
      trend_char = 'Rising';
    }
    else if (trend < 0) {
      trend_char = 'Falling';
    }
    else {
      trend_char = 'Steady';
    }
  }
  
  return trend_char;
}

function get_weather() {
  
  if (mainMenu !== null) {
    mainMenu.hide();
  }
  
  weatherUrl = Settings.option('weatherUrl');
  units = Settings.option('units');

  if (weatherUrl == null || units == null) {
    configRequiredCard.show();
    return;
  }
  
  fetchingCard.show();
  
  ajax({
    url: weatherUrl,
    type: 'json'
  },
  function(data) {
    mainMenu = buildWeatherMenus(data);
    fetchingCard.hide();
    mainMenu.show();
  },
  function(error) {    
    fetchingCard.hide();
    fetchFailedCard.show();
  });
}

function buildWeatherMenus(data) {
  var station_name = format(data.station.name);
  var local_time = format(data.time.time);

  var temperature_current = null;
  var temperature_trend = format_trend(data.temperature.trend);
  var temperature_high = null;
  var temperature_low = null;

  var surface_pressure_current = null;
  var surface_pressure_trend = null;
  var surface_pressure_high = null;
  var surface_pressure_low = null;
    
  var humidity_current = format(data.humidity.current) + '%';
  var humidity_trend = format_trend(data.humidity.trend);
  var humidity_high = format(data.humidity.high) + '%';
  var humidity_low = format(data.humidity.low) + '%';

  var daily_rainfall = null;
  var rainfall_rate = null;
  var max_rainfall_rate = null;
  var yesterday_rainfall = null;

  var average_wind_speed = null;
  var wind_direction = format(data.wind.direction.cardinal);
  var gust_speed = null;
  var max_gust_speed = null;

  if (units == 'metric') { // TODO - get degree symbold working
    temperature_current = format(data.temperature.current.c) + degreesC;
    temperature_high = format(data.temperature.high.c) + degreesC;
    temperature_low = format(data.temperature.low.c) + degreesC;

    surface_pressure_current = format(data.pressure.current.hpa) + ' hPa';
    surface_pressure_trend = format_trend(data.pressure.trend_per_hr.hpa);
    surface_pressure_high = format(data.pressure.high.hpa) + ' hPa';
    surface_pressure_low = format(data.pressure.low.hpa) + ' hPa';

    daily_rainfall = format(data.rainfall.daily.mm) + ' mm';
    rainfall_rate = format(data.rainfall.rate_per_min.mm) + ' mm/min';
    max_rainfall_rate = format(data.rainfall.max_rate_per_min.mm) + ' mm/min';
    yesterday_rainfall = format(data.rainfall.yesterday.mm) + ' mm';

    average_wind_speed = format(data.wind.avg_speed.kmh) + ' km/h';
    gust_speed = format(data.wind.gust_speed.kmh) + ' km/h';
    max_gust_speed = format(data.wind.max_gust_speed.kmh) + ' km/h';
  } else {
    temperature_current = format(data.temperature.current.f) + degreesF;
    temperature_high = format(data.temperature.high.f) + degreesF;
    temperature_low = format(data.temperature.low.f) + degreesF;

    surface_pressure_current = format(data.pressure.current.inhg) + ' inHg';
    surface_pressure_trend = format_trend(data.pressure.trend_per_hr.inhg);
    surface_pressure_high = format(data.pressure.high.inhg) + ' inHg';
    surface_pressure_low = format(data.pressure.low.inhg) + ' inHg';

    daily_rainfall = format(data.rainfall.daily.in) + ' in';
    rainfall_rate = format(data.rainfall.rate_per_min.in) + ' in/min';
    max_rainfall_rate = format(data.rainfall.max_rate_per_min.in) + ' in/min';
    yesterday_rainfall = format(data.rainfall.yesterday.in) + ' in';

    average_wind_speed = format(data.wind.avg_speed.mph) + ' mph';
    gust_speed = format(data.wind.gust_speed.mph) + ' mph';
    max_gust_speed = format(data.wind.max_gust_speed.mph) + ' mph';
  }

  var mainMenu =
      buildMainMenu(local_time, station_name, temperature_current, temperature_trend,
                    surface_pressure_current, surface_pressure_trend, humidity_current,
                    humidity_trend, daily_rainfall, average_wind_speed, wind_direction);

  var temperatureMenu =
      buildTemperatureMenu(temperature_current, temperature_trend, temperature_high,
                           temperature_low);

  var surfacePressureMenu =
      buildSurfacePressureMenu(surface_pressure_current, surface_pressure_trend,
                               surface_pressure_high, surface_pressure_low);

  var humidityMenu =
      buildHumidityMenu(humidity_current, humidity_trend, humidity_high, humidity_low);

  var rainfallMenu =
      buildRainfallMenu(daily_rainfall, rainfall_rate, max_rainfall_rate, yesterday_rainfall);

  var windMenu =
      buildWindMenu(average_wind_speed, wind_direction, gust_speed, max_gust_speed);

  mainMenu.on('select', function(e) {
    if (e.itemIndex  === 0) {
      temperatureMenu.show();
    } else if (e.itemIndex  == 1) {
      surfacePressureMenu.show();
    } else if (e.itemIndex  == 2) {
      humidityMenu.show();
    } else if (e.itemIndex  == 3) {
      rainfallMenu.show();
    } else if (e.itemIndex  == 4) {
      windMenu.show();
    } 
  });
    
  mainMenu.on('longSelect', function(e) {
    mainMenu.hide();
    get_weather();
  });
  
  return mainMenu;
}

function buildMainMenu(local_time, station_name, temperature_current, temperature_trend,
                       surface_pressure_current, surface_pressure_trend, humidity_current,
                       humidity_trend, daily_rainfall, average_wind_speed, wind_direction) {
  return new UI.Menu({
    sections: [{
      title: local_time + ' ' + station_name,
      items: [{
        title: 'Temperature',
        subtitle: temperature_current + ' ' + temperature_trend
      }, {
        title: 'Surface Pressure',
        subtitle: surface_pressure_current + ' ' + surface_pressure_trend
      }, {          
        title: 'Humidity',
        subtitle: humidity_current + ' ' + humidity_trend
      }, {
        title: 'Rainfall',
        subtitle: daily_rainfall
      }, {
        title: 'Wind',
        subtitle: average_wind_speed + ' ' + wind_direction
      }]
    }]
  });
}

function buildTemperatureMenu(temperature_current, temperature_trend, temperature_high, temperature_low) {
  return new UI.Menu({
    sections: [{
      title: 'Temperature',
      items: [{
        title: 'Current',
        subtitle: temperature_current + ' ' + temperature_trend
      }, {
        title: 'Daily High',
        subtitle: temperature_high
      }, {
        title: 'Daily Low',
        subtitle: temperature_low
      }]
    }]
  });
}

function buildSurfacePressureMenu(surface_pressure_current, surface_pressure_trend, surface_pressure_high, surface_pressure_low) {
  return new UI.Menu({
    sections: [{
      title: 'Surface Pressure',
      items: [{
        title: 'Current',
        subtitle: surface_pressure_current + ' ' + surface_pressure_trend
      }, {
        title: 'Daily High',
        subtitle: surface_pressure_high
      }, {
        title: 'Daily Low',
        subtitle: surface_pressure_low
      }]
    }]
  });
}

function buildHumidityMenu(humidity_current, humidity_trend, humidity_high, humidity_low) {
  return new UI.Menu({
    sections: [{
      title: 'Humidity',
      items: [{
        title: 'Current',
        subtitle: humidity_current + ' ' + humidity_trend
      }, {
        title: 'Daily High',
        subtitle: humidity_high
      }, {
        title: 'Daily Low',
        subtitle: humidity_low
      }]
    }]
  });
}

function buildRainfallMenu(daily_rainfall, rainfall_rate, max_rainfall_rate, yesterday_rainfall) {
  return new UI.Menu({
    sections: [{
      title: 'Rainfall',
      items: [{
        title: 'Daily Rainfall',
        subtitle: daily_rainfall
      }, {
        title: 'Current Rate',
        subtitle: rainfall_rate
      }, {
        title: 'Max Rate',
        subtitle: max_rainfall_rate
      }, {
        title: 'Yesterday',
        subtitle: yesterday_rainfall
      }]
    }]
  });
}

function buildWindMenu(average_wind_speed, wind_direction, gust_speed, max_gust_speed) {
  return new UI.Menu({
    sections: [{
      title: 'Wind',
      items: [{
        title: 'Avg Wind Speed',
        subtitle: average_wind_speed          
      }, {
        title: 'Wind Direction',
        subtitle: wind_direction
      }, {
        title: 'Gust Speed',
        subtitle: gust_speed             
      }, {
        title: 'Max Gust Speed',
        subtitle: max_gust_speed                
      }]
    }]
  });
}

get_weather();
