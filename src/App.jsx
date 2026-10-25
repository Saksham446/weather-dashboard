import { useEffect, useState } from "react";
import {
  Search, MapPin, Wind, Droplets, Eye, Sunrise, Sunset,
  RefreshCw, CalendarDays, Umbrella, Sun, Cloud, CloudRain,
  CloudSnow, CloudLightning, CloudSun, LoaderCircle, Thermometer,
  Compass, Gauge
} from "lucide-react";
import "./App.css";

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const API = "https://api.open-meteo.com/v1/forecast";

const conditions = {
  0: ["Clear sky", "sun"],
  1: ["Mainly clear", "sun"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloud"],
  45: ["Foggy", "cloud"],
  48: ["Rime fog", "cloud"],
  51: ["Light drizzle", "rain"],
  53: ["Drizzle", "rain"],
  55: ["Dense drizzle", "rain"],
  61: ["Light rain", "rain"],
  63: ["Moderate rain", "rain"],
  65: ["Heavy rain", "rain"],
  71: ["Light snowfall", "snow"],
  73: ["Snowfall", "snow"],
  75: ["Heavy snowfall", "snow"],
  80: ["Rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Heavy showers", "rain"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm", "storm"],
  99: ["Thunderstorm", "storm"]
};

function WeatherIcon({ code = 1, size = 42 }) {
  const type = conditions[code]?.[1] || "partly";
  if (type === "sun") return <Sun size={size} className="sun-icon" strokeWidth={1.5} />;
  if (type === "cloud") return <Cloud size={size} strokeWidth={1.5} />;
  if (type === "rain") return <CloudRain size={size} className="rain-icon" strokeWidth={1.5} />;
  if (type === "snow") return <CloudSnow size={size} strokeWidth={1.5} />;
  if (type === "storm") return <CloudLightning size={size} className="rain-icon" strokeWidth={1.5} />;
  return <CloudSun size={size} className="sun-icon" strokeWidth={1.5} />;
}

function Metric({ icon: Icon, title, value, detail }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className="metric-icon"><Icon size={19} /></span><span>{title}</span></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}

function App() {
  const [city, setCity] = useState("New Delhi");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("C");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);

  const temp = (value) => {
    if (value == null || Number.isNaN(Number(value))) return "--°";
    return `${Math.round(unit === "C" ? value : value * 9 / 5 + 32)}°`;
  };

  async function loadWeather(search = city) {
    setLoading(true);
    setError("");
    try {
      const geoResponse = await fetch(
        `${GEO}?name=${encodeURIComponent(search)}&count=1&language=en&format=json`
      );
      if (!geoResponse.ok) throw new Error("City search is temporarily unavailable.");
      const geo = await geoResponse.json();
      if (!geo.results?.length) throw new Error("City not found. Try another city name.");

      const selected = geo.results[0];
      const params = new URLSearchParams({
        latitude: selected.latitude,
        longitude: selected.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
        hourly: "temperature_2m,precipitation_probability,weather_code",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "7",
        wind_speed_unit: "kmh"
      });
      const response = await fetch(`${API}?${params}`);
      if (!response.ok) throw new Error("Weather data is unavailable. Please retry.");
      const data = await response.json();

      setPlace(selected);
      setWeather(data);
      setCity(selected.name);
      setUpdated(new Date());
    } catch (e) {
      setError(e.message || "Unable to load weather. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("New Delhi");
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    if (query.trim()) loadWeather(query.trim());
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const code = current?.weather_code ?? 1;
  const description = conditions[code]?.[0] || "Current conditions";

  const currentHour = hourly?.time?.findIndex(
    (t) => t.slice(0, 13) === current?.time?.slice(0, 13)
  ) ?? 0;
  const hourIndices = Array.from({ length: 6 }, (_, i) =>
    Math.min(Math.max(currentHour, 0) + i * 3, (hourly?.time?.length || 1) - 1)
  );

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-logo"><CloudSun size={24} /></span>
          <span>sky<span className="brand-light">cast</span></span>
          <span className="brand-badge">WEATHER</span>
        </a>
        <div className="header-actions">
          <span className="live-label"><span className="live-dot" /> LIVE DATA</span>
          <button className="unit-switch" onClick={() => setUnit(unit === "C" ? "F" : "C")} aria-label="Toggle Celsius and Fahrenheit">
            <span className={unit === "C" ? "selected" : ""}>°C</span>
            <span className={unit === "F" ? "selected" : ""}>°F</span>
          </button>
        </div>
      </header>

      <section className="welcome" id="top">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL WEATHER STATION</div>
        <h1>Weather, <span>reimagined.</span></h1>
        <p>Every forecast tells a story. Find yours.</p>
      </section>

      <form className="search-box" onSubmit={submitSearch}>
        <Search size={20} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any city around the world..." aria-label="City name" />
        <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <><Search size={17} /> Search</>}</button>
      </form>

      {error && <div className="error-box">{error}<button onClick={() => loadWeather(city)}>Try again</button></div>}

      {loading && !weather ? (
        <div className="loading-screen"><LoaderCircle className="spin" size={34} /><p>Finding your forecast...</p></div>
      ) : weather && current ? (
        <>
          <section className="hero-card">
            <div className="hero-main">
              <div className="location"><MapPin size={17} /> {place?.name}{place?.admin1 ? `, ${place.admin1}` : ""}{place?.country ? `, ${place.country}` : ""}</div>
              <div className="current-label">CURRENT WEATHER</div>
              <div className="hero-temperature">
                <span>{temp(current.temperature_2m)}</span>
                <WeatherIcon code={code} size={70} />
              </div>
              <h2>{description}</h2>
              <p className="feels">Feels like {temp(current.apparent_temperature)}</p>
              <div className="high-low"><span>↑ {temp(daily?.temperature_2m_max?.[0])} High</span><span>↓ {temp(daily?.temperature_2m_min?.[0])} Low</span></div>
            </div>
            <div className="hero-illustration">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="hero-sun"><WeatherIcon code={code} size={120} /></div>
              <div className="illustration-caption">{current.is_day ? "DAYTIME" : "NIGHTTIME"} <span>•</span> {description.toUpperCase()}</div>
              <div className="illustration-stats"><span><Thermometer size={15} /> {temp(current.apparent_temperature)} feels like</span><span><Wind size={15} /> {Math.round(current.wind_speed_10m)} km/h wind</span></div>
            </div>
            <div className="hero-footer">
              <span><span className="live-dot" /> {updated ? `Updated ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live weather"}</span>
              <button onClick={() => loadWeather(city)} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh</button>
            </div>
          </section>

          <section className="metrics-grid">
            <Metric icon={Droplets} title="Humidity" value={`${current.relative_humidity_2m}%`} detail="Relative humidity" />
            <Metric icon={Wind} title="Wind speed" value={`${Math.round(current.wind_speed_10m)} km/h`} detail="Surface wind" />
            <Metric icon={Umbrella} title="Rain probability" value={`${daily?.precipitation_probability_max?.[0] ?? 0}%`} detail="Today's chance" />
            <Metric icon={Gauge} title="UV index" value={daily?.uv_index_max?.[0] ?? "—"} detail="Today's maximum" />
          </section>

          <section className="section">
            <div className="section-heading"><div><span className="section-kicker">PLAN YOUR DAY</span><h2><CalendarDays size={22} /> Hourly forecast</h2></div><span className="section-pill">NEXT HOURS</span></div>
            <div className="hourly-card">
              {hourIndices.map((idx, i) => (
                <div className={`hour-item ${i === 0 ? "hour-now" : ""}`} key={`${hourly.time[idx]}-${i}`}>
                  <span className="hour-time">{i === 0 ? "Now" : new Date(hourly.time[idx]).toLocaleTimeString([], { hour: "numeric" })}</span>
                  <WeatherIcon code={hourly.weather_code?.[idx] ?? code} size={29} />
                  <strong>{temp(hourly.temperature_2m[idx])}</strong>
                  <span className="hour-rain"><Droplets size={12} /> {hourly.precipitation_probability?.[idx] ?? 0}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-heading"><div><span className="section-kicker">LOOKING AHEAD</span><h2><CalendarDays size={22} /> 7-day forecast</h2></div><span className="section-pill">DAILY OUTLOOK</span></div>
            <div className="forecast-card">
              {daily.time.map((date, i) => (
                <div className="forecast-row" key={date}>
                  <div className="forecast-day"><strong>{i === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</strong><span>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                  <WeatherIcon code={daily.weather_code[i]} size={27} />
                  <span className="forecast-condition">{conditions[daily.weather_code[i]]?.[0] || "Mixed conditions"}</span>
                  <div className="forecast-temperatures"><span>{temp(daily.temperature_2m_max[i])}</span><div className="temp-track"><div /></div><span>{temp(daily.temperature_2m_min[i])}</span></div>
                  <span className="forecast-rain"><Droplets size={14} /> {daily.precipitation_probability_max?.[i] ?? 0}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="sun-grid">
            <article className="sun-card sunrise-card"><div className="sun-card-title"><Sunrise size={20} /><span>Sunrise</span></div><strong>{daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</strong><p>Start the day bright</p><div className="sun-arc"><Sun size={40} /></div></article>
            <article className="sun-card sunset-card"><div className="sun-card-title"><Sunset size={20} /><span>Sunset</span></div><strong>{daily?.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</strong><p>Golden hour awaits</p><div className="sun-arc"><Sun size={40} /></div></article>
          </section>
        </>
      ) : null}

      <footer className="footer">
        <a className="footer-brand" href="#top"><CloudSun size={19} /> skycast</a>
        <span>Weather data by Open-Meteo</span>
        <span>Made with care · React + Vite</span>
      </footer>
    </main>
  );
}

export default App;
