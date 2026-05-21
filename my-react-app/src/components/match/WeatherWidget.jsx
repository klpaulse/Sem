import { useEffect, useState } from "react";

const weatherCache = new Map();

const WMO_ICON = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌦️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "❄️", 75: "❄️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "❄️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const WMO_LABEL = {
  0: "Klarvær", 1: "Lettskyet", 2: "Delvis skyet", 3: "Overskyet",
  45: "Tåke", 48: "Tåke",
  51: "Yr", 53: "Yr", 55: "Yr",
  61: "Lett regn", 63: "Regn", 65: "Kraftig regn",
  71: "Snøbyger", 73: "Snø", 75: "Kraftig snø",
  80: "Regnbyger", 81: "Regnbyger", 82: "Kraftige byger",
  85: "Snøbyger", 86: "Snøbyger",
  95: "Tordenvær", 96: "Tordenvær", 99: "Tordenvær",
};

export default function WeatherWidget({ arena, matchDate, matchTime }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!matchDate) return;

    const now = new Date();
    const matchDt = new Date(matchDate);
    if (matchTime) {
      const [h, m] = matchTime.split(":");
      matchDt.setHours(parseInt(h), parseInt(m || "0"), 0, 0);
    }

    // Ikke hent vær for fortid eller mer enn 16 dager frem
    const daysAhead = (matchDt - now) / (1000 * 60 * 60 * 24);
    if (daysAhead < 0 || daysAhead > 16) return;

    async function load() {
      try {
        let lat = 59.267, lon = 10.408; // Fallback: Tønsberg

        if (arena && arena !== "ukjent") {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(arena)}&count=1&language=no&format=json`
          );
          const geoData = await geoRes.json();
          if (geoData.results?.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
          }
        }

        const dateStr = matchDt.toISOString().slice(0, 10);
        const matchHour = matchDt.getHours();
        const cacheKey = `${lat},${lon},${dateStr},${matchHour}`;

        if (weatherCache.has(cacheKey)) {
          setWeather(weatherCache.get(cacheKey));
          return;
        }

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&hourly=temperature_2m,precipitation,windspeed_10m,weathercode` +
          `&timezone=Europe%2FOslo&start_date=${dateStr}&end_date=${dateStr}`
        );
        const data = await weatherRes.json();

        if (!data.hourly?.time) return;

        const idx = data.hourly.time.findIndex(t => new Date(t).getHours() === matchHour);
        if (idx === -1) return;

        const result = {
          temp: Math.round(data.hourly.temperature_2m[idx]),
          wind: Math.round(data.hourly.windspeed_10m[idx]),
          rain: data.hourly.precipitation[idx],
          code: data.hourly.weathercode[idx],
        };
        weatherCache.set(cacheKey, result);
        setWeather(result);
      } catch (err) {
        console.error("WeatherWidget:", err);
      }
    }

    load();
  }, [arena, matchDate, matchTime]);

  if (!weather) return null;

  const icon = WMO_ICON[weather.code] ?? "🌡️";
  const label = WMO_LABEL[weather.code] ?? "";

  return (
    <div className="kampinfo-row">
      <dt className="kampinfo-label">Vær:</dt>
      <dd className="kampinfo-value weather-value">
        <span className="weather-icon">{icon}</span>
        <span>{label} · {weather.temp}°C</span>
        {weather.wind > 0 && <span className="weather-wind">· {weather.wind} m/s</span>}
        {weather.rain > 0 && <span className="weather-rain">· {weather.rain}mm</span>}
      </dd>
    </div>
  );
}
