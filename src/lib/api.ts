// All weather data comes from Open-Meteo (https://open-meteo.com) — free, no API key required.
// Values are always requested in metric units; unit conversion happens client-side so that
// switching units is instant and never refetches.

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  countryCode?: string;
}

export interface Forecast {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    dewPoint: number;
    isDay: boolean;
    precipitation: number;
    weatherCode: number;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    visibility: number;
    uvIndex: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    precipitationProbability: number;
    weatherCode: number;
    isDay: boolean;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    max: number;
    min: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    precipitationProbability: number;
    precipitationSum: number;
    windSpeedMax: number;
  }>;
}

export interface AirQuality {
  usAqi: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide: number;
}

export interface RadarFrames {
  host: string;
  frames: Array<{ time: number; path: string }>;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Geocoding                                                          */
/* ------------------------------------------------------------------ */

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    country_code?: string;
  }>;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' });
  const data = await getJson<GeocodingResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    signal,
  );
  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    countryCode: r.country_code,
  }));
}

interface NominatimResponse {
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/** Turns coordinates into a readable place name (used for "my location" and map clicks). */
export async function reverseGeocode(latitude: number, longitude: number): Promise<Place> {
  const fallback: Place = {
    id: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
    name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    latitude,
    longitude,
  };
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      zoom: '10',
      'accept-language': 'en',
    });
    const data = await getJson<NominatimResponse>(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
    );
    const a = data.address ?? {};
    const name = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? data.name ?? a.state;
    if (!name) return fallback;
    return {
      ...fallback,
      name,
      admin1: a.state !== name ? a.state : undefined,
      country: a.country,
      countryCode: a.country_code?.toUpperCase(),
    };
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Forecast                                                           */
/* ------------------------------------------------------------------ */

interface OpenMeteoForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: Record<string, number | string>;
  hourly: Record<string, Array<number | string>>;
  daily: Record<string, Array<number | string>>;
}

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'dew_point_2m',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'visibility',
  'uv_index',
];
const HOURLY_FIELDS = ['temperature_2m', 'precipitation_probability', 'weather_code', 'is_day'];
const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_probability_max',
  'precipitation_sum',
  'wind_speed_10m_max',
];

export async function fetchForecast(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_FIELDS.join(','),
    hourly: HOURLY_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    timezone: 'auto',
    forecast_days: '10',
  });
  const d = await getJson<OpenMeteoForecast>(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  const c = d.current;
  const n = (v: number | string | undefined) => Number(v ?? 0);

  return {
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone,
    timezoneAbbreviation: d.timezone_abbreviation,
    utcOffsetSeconds: d.utc_offset_seconds,
    current: {
      time: String(c.time),
      temperature: n(c.temperature_2m),
      apparentTemperature: n(c.apparent_temperature),
      humidity: n(c.relative_humidity_2m),
      dewPoint: n(c.dew_point_2m),
      isDay: n(c.is_day) === 1,
      precipitation: n(c.precipitation),
      weatherCode: n(c.weather_code),
      cloudCover: n(c.cloud_cover),
      pressure: n(c.pressure_msl),
      windSpeed: n(c.wind_speed_10m),
      windDirection: n(c.wind_direction_10m),
      windGusts: n(c.wind_gusts_10m),
      visibility: n(c.visibility),
      uvIndex: n(c.uv_index),
    },
    hourly: d.hourly.time.map((time, i) => ({
      time: String(time),
      temperature: n(d.hourly.temperature_2m[i]),
      precipitationProbability: n(d.hourly.precipitation_probability[i]),
      weatherCode: n(d.hourly.weather_code[i]),
      isDay: n(d.hourly.is_day[i]) === 1,
    })),
    daily: d.daily.time.map((date, i) => ({
      date: String(date),
      weatherCode: n(d.daily.weather_code[i]),
      max: n(d.daily.temperature_2m_max[i]),
      min: n(d.daily.temperature_2m_min[i]),
      sunrise: String(d.daily.sunrise[i]),
      sunset: String(d.daily.sunset[i]),
      uvIndexMax: n(d.daily.uv_index_max[i]),
      precipitationProbability: n(d.daily.precipitation_probability_max[i]),
      precipitationSum: n(d.daily.precipitation_sum[i]),
      windSpeedMax: n(d.daily.wind_speed_10m_max[i]),
    })),
  };
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide',
    timezone: 'auto',
  });
  const d = await getJson<{ current: Record<string, number> }>(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    signal,
  );
  return {
    usAqi: d.current.us_aqi,
    pm2_5: d.current.pm2_5,
    pm10: d.current.pm10,
    ozone: d.current.ozone,
    nitrogenDioxide: d.current.nitrogen_dioxide,
  };
}

/* ------------------------------------------------------------------ */
/* Rain radar (RainViewer — free, no key)                             */
/* ------------------------------------------------------------------ */

export async function fetchRadarFrames(signal?: AbortSignal): Promise<RadarFrames> {
  const d = await getJson<{ host: string; radar: { past: RadarFrames['frames']; nowcast?: RadarFrames['frames'] } }>(
    'https://api.rainviewer.com/public/weather-maps.json',
    signal,
  );
  return { host: d.host, frames: [...d.radar.past, ...(d.radar.nowcast ?? [])] };
}

/* ------------------------------------------------------------------ */
/* Optional city photo (Unsplash) — only used if a key is configured  */
/* ------------------------------------------------------------------ */

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
export const hasPhotoSupport = Boolean(UNSPLASH_KEY);

export async function fetchCityPhoto(city: string, signal?: AbortSignal): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  const params = new URLSearchParams({
    query: `${city} city`,
    client_id: UNSPLASH_KEY,
    orientation: 'landscape',
    per_page: '1',
  });
  const data = await getJson<{ results?: Array<{ urls: { regular: string } }> }>(
    `https://api.unsplash.com/search/photos?${params}`,
    signal,
  );
  const url = data.results?.[0]?.urls.regular;
  if (!url) return null;
  // Preload so the background can cross-fade in only once the image is ready.
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
  return url;
}
