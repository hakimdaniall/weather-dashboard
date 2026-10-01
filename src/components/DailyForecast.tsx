import { motion } from 'motion/react';
import { CalendarDays, Droplet } from 'lucide-react';
import type { Forecast } from '@/lib/api';
import { formatTemp, formatWeekday, tempColor } from '@/lib/format';
import { useSettings } from '@/store/settings';
import WeatherIcon from './WeatherIcon';

export default function DailyForecast({ forecast }: { forecast: Forecast }) {
  const tempUnit = useSettings((s) => s.tempUnit);
  const { daily, current } = forecast;

  const weekMin = Math.min(...daily.map((d) => d.min));
  const weekMax = Math.max(...daily.map((d) => d.max));
  const span = Math.max(1, weekMax - weekMin);
  const pct = (t: number) => ((t - weekMin) / span) * 100;

  return (
    <section className="glass p-5">
      <h2 className="tile-label mb-2">
        <CalendarDays className="size-3.5" /> {daily.length}-day forecast
      </h2>
      <ul className="divide-y divide-white/10">
        {daily.map((day, i) => (
          <motion.li
            key={day.date}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[3.25rem_2.5rem_2.75rem_2.5rem_1fr_2.5rem] items-center gap-2 py-2"
          >
            <span className="text-sm font-medium">{i === 0 ? 'Today' : formatWeekday(day.date)}</span>
            <WeatherIcon code={day.weatherCode} className="size-9" />
            <span className="text-[11px] font-medium text-sky-300">
              {day.precipitationProbability >= 20 && (
                <span className="inline-flex items-center gap-0.5">
                  <Droplet className="size-2.5 fill-current" />
                  {day.precipitationProbability}%
                </span>
              )}
            </span>
            <span className="text-right text-sm text-white/55 tabular-nums">{formatTemp(day.min, tempUnit)}</span>
            <div className="relative h-1.5 rounded-full bg-white/12" title={`${formatTemp(day.min, tempUnit)} – ${formatTemp(day.max, tempUnit)}`}>
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${pct(day.min)}%`,
                  right: `${100 - pct(day.max)}%`,
                  backgroundImage: `linear-gradient(90deg, ${tempColor(day.min)}, ${tempColor(day.max)})`,
                }}
              />
              {i === 0 && (
                <div
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/60 bg-white"
                  style={{ left: `${Math.min(100, Math.max(0, pct(current.temperature)))}%` }}
                  title="Now"
                />
              )}
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatTemp(day.max, tempUnit)}</span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
