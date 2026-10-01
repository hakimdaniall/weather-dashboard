import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Droplet } from 'lucide-react';
import type { Forecast } from '@/lib/api';
import { describeWeather } from '@/lib/weather-codes';
import { formatLocalTime, formatTemp, nowIsoAt, toTemp } from '@/lib/format';
import { useSettings } from '@/store/settings';
import WeatherIcon from './WeatherIcon';

const COL = 64; // px per hour column — the chart below is laid out on the same grid

export default function HourlyForecast({ forecast }: { forecast: Forecast }) {
  const { tempUnit, timeFormat } = useSettings();

  const nowHour = nowIsoAt(forecast.utcOffsetSeconds).slice(0, 13);
  const start = Math.max(0, forecast.hourly.findIndex((h) => h.time.slice(0, 13) >= nowHour));
  const hours = forecast.hourly.slice(start, start + 25).map((h, i) => ({
    ...h,
    label: i === 0 ? 'Now' : formatLocalTime(h.time, timeFormat, timeFormat === '24h'),
    temp: toTemp(h.temperature, tempUnit),
  }));

  const summary = buildSummary(forecast, hours);

  return (
    <section className="glass p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="tile-label">Next 24 hours</h2>
      </div>
      <p className="mb-3 text-sm text-white/80">{summary}</p>

      <div className="scrollbar-none -mx-5 overflow-x-auto px-5">
        <div style={{ width: hours.length * COL }}>
          <div className="flex">
            {hours.map((h) => (
              <div key={h.time} className="flex shrink-0 flex-col items-center gap-1" style={{ width: COL }}>
                <span className="text-xs font-medium text-white/70">{h.label}</span>
                <WeatherIcon code={h.weatherCode} isDay={h.isDay} className="size-10" />
                <span className="h-4 text-[11px] font-medium text-sky-300">
                  {h.precipitationProbability >= 10 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Droplet className="size-2.5 fill-current" />
                      {h.precipitationProbability}%
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold tabular-nums">{formatTemp(h.temperature, tempUnit)}</span>
              </div>
            ))}
          </div>

          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hours} margin={{ top: 10, right: COL / 2, bottom: 4, left: COL / 2 }}>
                <defs>
                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin - 2', 'dataMax + 1']} />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.35)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const h = payload[0].payload as (typeof hours)[number];
                    return (
                      <div className="rounded-lg border border-white/15 bg-slate-900/90 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur">
                        <p className="font-semibold">{h.label} · {h.temp}°</p>
                        <p className="text-white/60">
                          {describeWeather(h.weatherCode, h.isDay).label} · {h.precipitationProbability}% rain
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#fde68a"
                  strokeWidth={2}
                  fill="url(#tempFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#fde68a', stroke: '#0f172a', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildSummary(forecast: Forecast, hours: Array<{ precipitationProbability: number; label: string; temp: number }>) {
  const rainy = hours.find((h, i) => i > 0 && h.precipitationProbability >= 50);
  const current = describeWeather(forecast.current.weatherCode, forecast.current.isDay).label;
  if (rainy) return `${current} now. Rain likely around ${rainy.label}.`;
  const temps = hours.map((h) => h.temp);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  return `${current} now. Temperatures between ${min}° and ${max}° over the next day.`;
}
