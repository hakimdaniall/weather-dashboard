# Skycast — Weather Dashboard

A fast, good-looking weather dashboard built with React 19, TanStack Query and Tailwind CSS v4.
It runs out of the box: **no API key is needed**.

## Features

- **City search palette**: press `⌘K`, `Ctrl+K` or `/` to open it. Results autocomplete as you type, and the highlighted city's forecast is prefetched before you press Enter.
- **Use my location** through browser geolocation, with reverse geocoding to get a readable city name.
- **Current conditions** with animated weather icons and the city's local time and date.
- **24-hour forecast**: an hour-by-hour strip with a temperature curve and rain chances.
- **10-day forecast** with iOS-style temperature range bars. Today's bar marks the current temperature.
- **Detail tiles**: UV index, wind compass and gusts, sunrise/sunset arc, air quality (US AQI and PM2.5), feels like, humidity and dew point, precipitation, visibility and pressure.
- **Live rain radar**: an animated timeline you can play or scrub. Click anywhere on the map to load the weather there.
- **Saved cities**: star a city to pin it. Pinned cities show live temperatures.
- **Units**: °C or °F, km/h, mph, m/s or knots, and 12- or 24-hour time. Settings are saved in localStorage, and switching units never refetches.
- **Shareable URLs**: the selected city is stored in the query string (`?lat=…&lon=…&name=…`), so links work and the back button moves between cities.
- **Dynamic sky**: the background gradient follows the condition and day or night. It adds rain, snow, stars and lightning, and respects `prefers-reduced-motion`.

## TanStack Query patterns used

| Pattern | Where |
| --- | --- |
| `queryOptions` factories that share keys between `useQuery`, `useQueries` and `prefetchQuery` | `src/lib/queries.ts` |
| Prefetching on hover/highlight, so selecting a city is instant | `SearchCommand.tsx` |
| `useQueries` for parallel fetching of all saved cities, sharing the cache with the main view | `SavedCities.tsx` |
| `placeholderData: keepPreviousData` for smooth city switching (the old data stays dimmed while new data loads) | `Dashboard.tsx` |
| `staleTime`, background `refetchInterval` and refetch on window focus | `queries.ts` |
| `invalidateQueries` for the manual refresh button | `Dashboard.tsx` |
| `useMutation` for the geolocation flow (pending and error states) | `useGeolocate.ts` |
| AbortSignal passed to `fetch`, so superseded searches are cancelled | `api.ts` |
| React Query Devtools (dev only) | `main.tsx` |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query v5 · React Router · Zustand (persisted settings) ·
Recharts · Motion · cmdk · Radix UI · React Leaflet · Sonner · Meteocons animated icons

## Data sources (all free, no key)

- [Open-Meteo](https://open-meteo.com/) for forecasts, geocoding and air quality
- [RainViewer](https://www.rainviewer.com/api.html) for radar tiles
- [Esri](https://www.esri.com/) for the dark basemap tiles
- [OpenStreetMap Nominatim](https://nominatim.org/) for reverse geocoding

## Getting started

```bash
npm install
npm run dev
```

### Optional: city photos

Copy `.env.example` to `.env` and add an [Unsplash](https://unsplash.com/developers) access key. A photo of
the selected city then fades in behind the dashboard. Without a key, the weather gradients are used.

## Project structure

```
src/
  components/      UI cards (CurrentConditions, HourlyForecast, DailyForecast, DetailTiles, RadarMap, …)
    ui/            Small shadcn-style primitives
  hooks/           usePlace (URL state), useGeolocate, useNow, useDebouncedValue
  lib/
    api.ts         Fetchers + response normalization
    queries.ts     TanStack Query option factories
    format.ts      Units, time zones, formatting
    weather-codes.ts  WMO code → label, icon, background
  store/           Zustand settings store (units, saved cities, recents)
  pages/Dashboard.tsx
```
