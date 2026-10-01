// WMO weather interpretation codes, as returned by Open-Meteo.
// https://open-meteo.com/en/docs#weathervariables

export type Condition = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

interface CodeInfo {
  label: string;
  condition: Condition;
  /** Animated Meteocons icon name; `{d}` is replaced with "day" or "night". */
  icon: string;
}

const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', condition: 'clear', icon: 'clear-{d}' },
  1: { label: 'Mainly clear', condition: 'clear', icon: 'partly-cloudy-{d}' },
  2: { label: 'Partly cloudy', condition: 'partly', icon: 'partly-cloudy-{d}' },
  3: { label: 'Overcast', condition: 'cloudy', icon: 'overcast-{d}' },
  45: { label: 'Fog', condition: 'fog', icon: 'fog-{d}' },
  48: { label: 'Freezing fog', condition: 'fog', icon: 'fog-{d}' },
  51: { label: 'Light drizzle', condition: 'drizzle', icon: 'partly-cloudy-{d}-drizzle' },
  53: { label: 'Drizzle', condition: 'drizzle', icon: 'drizzle' },
  55: { label: 'Heavy drizzle', condition: 'drizzle', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', condition: 'drizzle', icon: 'sleet' },
  57: { label: 'Freezing drizzle', condition: 'drizzle', icon: 'sleet' },
  61: { label: 'Light rain', condition: 'rain', icon: 'partly-cloudy-{d}-rain' },
  63: { label: 'Rain', condition: 'rain', icon: 'rain' },
  65: { label: 'Heavy rain', condition: 'rain', icon: 'rain' },
  66: { label: 'Freezing rain', condition: 'rain', icon: 'sleet' },
  67: { label: 'Freezing rain', condition: 'rain', icon: 'sleet' },
  71: { label: 'Light snow', condition: 'snow', icon: 'partly-cloudy-{d}-snow' },
  73: { label: 'Snow', condition: 'snow', icon: 'snow' },
  75: { label: 'Heavy snow', condition: 'snow', icon: 'snow' },
  77: { label: 'Snow grains', condition: 'snow', icon: 'snow' },
  80: { label: 'Rain showers', condition: 'rain', icon: 'partly-cloudy-{d}-rain' },
  81: { label: 'Rain showers', condition: 'rain', icon: 'rain' },
  82: { label: 'Violent showers', condition: 'rain', icon: 'rain' },
  85: { label: 'Snow showers', condition: 'snow', icon: 'partly-cloudy-{d}-snow' },
  86: { label: 'Snow showers', condition: 'snow', icon: 'snow' },
  95: { label: 'Thunderstorm', condition: 'storm', icon: 'thunderstorms-{d}-rain' },
  96: { label: 'Thunderstorm, hail', condition: 'storm', icon: 'thunderstorms-{d}-rain' },
  99: { label: 'Thunderstorm, hail', condition: 'storm', icon: 'thunderstorms-{d}-rain' },
};

const UNKNOWN: CodeInfo = { label: 'Unknown', condition: 'cloudy', icon: 'not-available' };

// Only the icons referenced above (plus a few extras) are bundled.
const ICON_URLS = import.meta.glob<string>(
  '/node_modules/@bybas/weather-icons/production/fill/all/{clear,partly-cloudy,overcast,fog,thunderstorms}-*.svg',
  { eager: true, query: '?url', import: 'default' },
);
const EXTRA_ICON_URLS = import.meta.glob<string>(
  '/node_modules/@bybas/weather-icons/production/fill/all/{drizzle,rain,sleet,snow,not-available,sunrise,sunset,raindrop,umbrella}.svg',
  { eager: true, query: '?url', import: 'default' },
);

export function iconUrl(name: string): string {
  const key = `/node_modules/@bybas/weather-icons/production/fill/all/${name}.svg`;
  return ICON_URLS[key] ?? EXTRA_ICON_URLS[key] ?? EXTRA_ICON_URLS[key.replace(name, 'not-available')];
}

export function describeWeather(code: number, isDay = true) {
  const info = CODES[code] ?? UNKNOWN;
  return {
    label: info.label,
    condition: info.condition,
    icon: iconUrl(info.icon.replace('{d}', isDay ? 'day' : 'night')),
  };
}

/** Background gradient per condition — tuned to keep white text legible. */
export function skyGradient(condition: Condition, isDay: boolean): string {
  if (!isDay) {
    switch (condition) {
      case 'clear':
      case 'partly':
        return 'linear-gradient(160deg, #0b1026 0%, #1b2353 45%, #3a2f6b 100%)';
      case 'storm':
        return 'linear-gradient(160deg, #07070f 0%, #1c1530 55%, #2f2347 100%)';
      case 'snow':
        return 'linear-gradient(160deg, #111827 0%, #27344d 55%, #46566f 100%)';
      default:
        return 'linear-gradient(160deg, #0b0f19 0%, #1a2232 55%, #2b3546 100%)';
    }
  }
  switch (condition) {
    case 'clear':
      return 'linear-gradient(160deg, #1e6fd9 0%, #3b8de8 45%, #f59e5b 130%)';
    case 'partly':
      return 'linear-gradient(160deg, #2763b8 0%, #4b86c9 55%, #8fb3d9 120%)';
    case 'cloudy':
      return 'linear-gradient(160deg, #46566b 0%, #66788f 55%, #8d9bb0 110%)';
    case 'fog':
      return 'linear-gradient(160deg, #545e6c 0%, #7a8592 55%, #a0a8b2 115%)';
    case 'drizzle':
    case 'rain':
      return 'linear-gradient(160deg, #233447 0%, #3b5266 55%, #5b7286 110%)';
    case 'snow':
      return 'linear-gradient(160deg, #4f6a86 0%, #7590ad 55%, #a9bfd4 115%)';
    case 'storm':
      return 'linear-gradient(160deg, #1b1d2e 0%, #33354d 55%, #4f4a68 110%)';
  }
}
