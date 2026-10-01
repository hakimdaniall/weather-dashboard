import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Place } from '@/lib/api';

export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'ms' | 'kn';
export type TimeFormat = '24h' | '12h';

interface SettingsState {
  tempUnit: TempUnit;
  windUnit: WindUnit;
  timeFormat: TimeFormat;
  favorites: Place[];
  recents: Place[];
  setTempUnit: (unit: TempUnit) => void;
  setWindUnit: (unit: WindUnit) => void;
  setTimeFormat: (format: TimeFormat) => void;
  toggleFavorite: (place: Place) => void;
  addRecent: (place: Place) => void;
  clearRecents: () => void;
}

export const samePlace = (a: Place, b: Place) =>
  Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

// Persisted to localStorage so units, saved cities and recent searches survive reloads.
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      tempUnit: 'c',
      windUnit: 'kmh',
      timeFormat: '24h',
      favorites: [],
      recents: [],
      setTempUnit: (tempUnit) => set({ tempUnit }),
      setWindUnit: (windUnit) => set({ windUnit }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      toggleFavorite: (place) =>
        set((s) => ({
          favorites: s.favorites.some((f) => samePlace(f, place))
            ? s.favorites.filter((f) => !samePlace(f, place))
            : [...s.favorites, place],
        })),
      addRecent: (place) =>
        set((s) => ({
          recents: [place, ...s.recents.filter((r) => !samePlace(r, place))].slice(0, 5),
        })),
      clearRecents: () => set({ recents: [] }),
    }),
    { name: 'weather-dashboard:settings', version: 1 },
  ),
);
