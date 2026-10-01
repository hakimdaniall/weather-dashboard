import { useQueries } from '@tanstack/react-query';
import { motion } from 'motion/react';
import type { Place } from '@/lib/api';
import { forecastQuery } from '@/lib/queries';
import { formatTemp } from '@/lib/format';
import { samePlace, useSettings } from '@/store/settings';
import { cn } from '@/lib/utils';
import WeatherIcon from './WeatherIcon';

interface SavedCitiesProps {
  current: Place;
  onSelect: (place: Place) => void;
}

/**
 * Saved cities with live conditions. useQueries fetches all of them in parallel and shares
 * the cache with the main view — switching to a saved city is instant.
 */
export default function SavedCities({ current, onSelect }: SavedCitiesProps) {
  const favorites = useSettings((s) => s.favorites);
  const tempUnit = useSettings((s) => s.tempUnit);
  const results = useQueries({
    queries: favorites.map((f) => forecastQuery(f.latitude, f.longitude)),
  });

  if (favorites.length === 0) return null;

  return (
    <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {favorites.map((place, i) => {
        const data = results[i]?.data;
        const active = samePlace(place, current);
        return (
          <motion.button
            key={place.id}
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelect(place)}
            className={cn(
              'glass flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl py-1.5 pr-4 pl-2 text-left transition hover:bg-white/12',
              active && 'border-white/40 bg-white/18',
            )}
          >
            {data ? (
              <WeatherIcon code={data.current.weatherCode} isDay={data.current.isDay} className="size-9" />
            ) : (
              <span className="size-9 animate-pulse rounded-full bg-white/10" />
            )}
            <span className="max-w-32 truncate text-sm font-medium">{place.name}</span>
            <span className="text-sm text-white/70 tabular-nums">{data ? formatTemp(data.current.temperature, tempUnit) : '–'}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
