import { motion } from 'motion/react';
import { RefreshCw, Star } from 'lucide-react';
import type { Forecast, Place } from '@/lib/api';
import { describeWeather } from '@/lib/weather-codes';
import { formatClock, formatTemp, nowAt, placeSubtitle, relativeTime, toTemp } from '@/lib/format';
import { samePlace, useSettings } from '@/store/settings';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/utils';
import WeatherIcon from './WeatherIcon';

interface CurrentConditionsProps {
  place: Place;
  forecast: Forecast;
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export default function CurrentConditions({ place, forecast, updatedAt, isFetching, onRefresh }: CurrentConditionsProps) {
  const { tempUnit, timeFormat, favorites, toggleFavorite } = useSettings();
  useNow(30_000);

  const { current, daily, utcOffsetSeconds, timezoneAbbreviation } = forecast;
  const today = daily[0];
  const { label } = describeWeather(current.weatherCode, current.isDay);
  const isFavorite = favorites.some((f) => samePlace(f, place));
  const localTime = nowAt(utcOffsetSeconds);
  const localDate = localTime.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="glass relative overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{place.name}</h1>
          {placeSubtitle(place) && <p className="truncate text-sm text-white/60">{placeSubtitle(place)}</p>}
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(place)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Remove from saved cities' : 'Save city'}
          className="-mt-1 -mr-1 shrink-0 cursor-pointer rounded-full p-2 transition hover:bg-white/10"
        >
          <motion.span
            key={String(isFavorite)}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="block"
          >
            <Star className={cn('size-5', isFavorite ? 'fill-amber-300 text-amber-300' : 'text-white/70')} />
          </motion.span>
        </button>
      </div>

      <p className="mt-1 text-sm text-white/60">
        {localDate} · {formatClock(localTime, timeFormat)} {timezoneAbbreviation}
      </p>

      <div className="mt-6 flex items-center justify-between gap-2">
        <div>
          <motion.div
            key={`${place.id}-${toTemp(current.temperature, tempUnit)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[5.5rem] leading-none font-extralight tracking-tighter tabular-nums"
          >
            {formatTemp(current.temperature, tempUnit)}
          </motion.div>
          <p className="mt-2 text-lg font-medium">{label}</p>
          <p className="text-sm text-white/65">
            H:{formatTemp(today.max, tempUnit)} · L:{formatTemp(today.min, tempUnit)}
          </p>
        </div>
        <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="size-36 shrink-0 drop-shadow-xl sm:size-40" />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
        <span>Updated {relativeTime(updatedAt)}</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-white disabled:cursor-default"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
          {isFetching ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
    </section>
  );
}
