import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_KEY = "323cf7dbd4a047ff649031a40a5ddb85"; // Replace with your API key

const App = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setHistory(savedHistory);
    
    // Auto-load last searched city if available
    if (savedHistory.length > 0) {
      setCity(savedHistory[0]);
      fetchWeather(savedHistory[0]);
    }
  }, []);

  const fetchWeather = async (cityToFetch = city) => {
    if (!cityToFetch) return;
    
    setLoading(true);
    setError(null);

    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToFetch}&appid=${API_KEY}&units=metric`
      );

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityToFetch}&appid=${API_KEY}&units=metric`
      );

      setWeather(weatherRes.data);
      setForecast(forecastRes.data.list.filter((_, index) => index % 8 === 0));

      const newHistory = [...new Set([cityToFetch, ...history])].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("City not found. Please check spelling and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUVClass = (uv) => {
    if (uv < 3) return "uv-low";
    if (uv < 6) return "uv-moderate";
    return "uv-high";
  };

  const getWeatherBackground = () => {
    if (!weather) return "default-bg";
    
    const id = weather.weather[0].id;
    const isDay = weather.weather[0].icon.includes('d');
    
    if (id >= 200 && id < 300) return "thunderstorm-bg";
    if (id >= 300 && id < 400) return "drizzle-bg";
    if (id >= 500 && id < 600) return "rain-bg";
    if (id >= 600 && id < 700) return "snow-bg";
    if (id >= 700 && id < 800) return "atmosphere-bg";
    if (id === 800) return isDay ? "clear-day-bg" : "clear-night-bg";
    return isDay ? "clouds-day-bg" : "clouds-night-bg";
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className={`app-container ${getWeatherBackground()}`}>
      <div className="glass-container">
        <div className="search-container">
          <h1>Weather Forecast</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for a city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={() => fetchWeather()} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {history.length > 0 && (
            <div className="history-chips">
              {history.map((item, index) => (
                <span 
                  key={index} 
                  className="history-chip" 
                  onClick={() => {
                    setCity(item);
                    fetchWeather(item);
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {weather && (
          <div className="weather-container">
            <div className="current-weather">
              <div className="weather-header">
                <div>
                  <h2>{weather.name}, {weather.sys.country}</h2>
                  <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="temp-container">
                  <span className="temperature">{Math.round(weather.main.temp)}°C</span>
                  <span className="feels-like">Feels like: {Math.round(weather.main.feels_like)}°C</span>
                </div>
              </div>
              
              <div className="weather-details">
                <div className="weather-icon-container">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                    alt="Weather Icon"
                    className="weather-icon"
                  />
                  <p className="weather-description">{weather.weather[0].description}</p>
                </div>
                
                <div className="stats-container">
                  <div className="stat-box">
                    <span className="stat-label">Humidity</span>
                    <span className="stat-value">{weather.main.humidity}%</span>
                  </div>
                  
                  <div className="stat-box">
                    <span className="stat-label">Wind</span>
                    <span className="stat-value">{Math.round(weather.wind.speed * 3.6)} km/h</span>
                  </div>
                  
                  <div className="stat-box">
                    <span className="stat-label">Pressure</span>
                    <span className="stat-value">{weather.main.pressure} hPa</span>
                  </div>
                  
                  <div className="stat-box">
                    <span className="stat-label">Visibility</span>
                    <span className="stat-value">{Math.round(weather.visibility / 1000)} km</span>
                  </div>
                </div>
              </div>

              <div className={`uv-index ${getUVClass(weather.main.temp)}`}>
                <span>UV Index: {Math.floor(weather.main.temp)}</span>
              </div>
            </div>

            <div className="forecast-section">
              <h3>5-Day Forecast</h3>
              <div className="forecast-container">
                {forecast.map((day) => (
                  <div key={day.dt} className="forecast-card">
                    <h4>{formatDate(day.dt)}</h4>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                      alt={day.weather[0].description}
                    />
                    <div className="forecast-temp">
                      <span className="high-temp">{Math.round(day.main.temp_max)}°</span>
                      <span className="low-temp">{Math.round(day.main.temp_min)}°</span>
                    </div>
                    <p className="forecast-description">{day.weather[0].description}</p>
                    <div className="forecast-details">
                      <span>{day.main.humidity}% humidity</span>
                      <span>{Math.round(day.wind.speed * 3.6)} km/h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {!weather && !loading && !error && (
          <div className="welcome-message">
            <h2>Welcome to Weather Forecast</h2>
            <p>Enter a city name to get the current weather and 5-day forecast</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;