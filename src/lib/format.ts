import type { TempUnit, TimeFormat, WindUnit } from '@/store/settings';

export const toTemp = (celsius: number, unit: TempUnit) =>
  Math.round(unit === 'f' ? celsius * 1.8 + 32 : celsius);

export const formatTemp = (celsius: number, unit: TempUnit) => `${toTemp(celsius, unit)}°`;

const WIND_FACTORS: Record<WindUnit, { factor: number; label: string }> = {
  kmh: { factor: 1, label: 'km/h' },
  mph: { factor: 0.621371, label: 'mph' },
  ms: { factor: 1 / 3.6, label: 'm/s' },
  kn: { factor: 0.539957, label: 'kn' },
};

export const toWind = (kmh: number, unit: WindUnit) => Math.round(kmh * WIND_FACTORS[unit].factor);
export const windLabel = (unit: WindUnit) => WIND_FACTORS[unit].label;

export function compassDirection(degrees: number) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

/*
 * Open-Meteo (timezone=auto) returns wall-clock times in the location's own timezone,
 * e.g. "2026-10-01T14:00". Parsing them as UTC and formatting in UTC shows that wall-clock
 * time exactly, regardless of the viewer's own timezone.
 */
export const parseLocal = (isoLocal: string) =>
  new Date(isoLocal.length === 10 ? `${isoLocal}T00:00Z` : `${isoLocal}Z`);

export function formatClock(date: Date, format: TimeFormat, withMinutes = true) {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: format === '12h' ? 'numeric' : '2-digit',
    minute: withMinutes ? '2-digit' : undefined,
    hour12: format === '12h',
  });
}

export const formatLocalTime = (isoLocal: string, format: TimeFormat, withMinutes = true) =>
  formatClock(parseLocal(isoLocal), format, withMinutes);

export const formatWeekday = (isoDate: string, style: 'short' | 'long' = 'short') =>
  parseLocal(isoDate).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: style });

export const formatDate = (isoDate: string) =>
  parseLocal(isoDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

/** Current wall-clock time at a location, as a Date to be formatted in UTC. */
export const nowAt = (utcOffsetSeconds: number) => new Date(Date.now() + utcOffsetSeconds * 1000);

/** Same shape as Open-Meteo local ISO strings ("YYYY-MM-DDTHH:mm") for easy comparison. */
export const nowIsoAt = (utcOffsetSeconds: number) => nowAt(utcOffsetSeconds).toISOString().slice(0, 16);

export function relativeTime(timestamp: number) {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} h ago`;
}

export const placeSubtitle = (p: { admin1?: string; country?: string }) =>
  [p.admin1, p.country].filter(Boolean).join(', ');

/** Maps a temperature (°C) onto a cold → hot color, used for the 10-day range bars. */
export function tempColor(celsius: number) {
  const stops: Array<[number, [number, number, number]]> = [
    [-15, [129, 140, 248]],
    [0, [56, 189, 248]],
    [10, [52, 211, 153]],
    [20, [250, 204, 21]],
    [28, [251, 146, 60]],
    [38, [239, 68, 68]],
  ];
  if (celsius <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`;
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (celsius <= t1) {
      const k = (celsius - t0) / (t1 - t0);
      const mix = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${mix.join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
