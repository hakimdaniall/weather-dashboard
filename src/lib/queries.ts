import { queryOptions } from '@tanstack/react-query';
import {
  fetchAirQuality,
  fetchCityPhoto,
  fetchForecast,
  fetchRadarFrames,
  searchPlaces,
} from './api';

// Query option factories: one place that defines each query's key + fetcher + cache policy.
// The same factory is used by useQuery, useQueries and queryClient.prefetchQuery,
// so a city prefetched on hover in the search box is an instant cache hit when selected.

const MINUTE = 60_000;

// Rounding keeps cache keys stable for coordinates that differ only by GPS jitter.
const coord = (n: number) => Math.round(n * 100) / 100;

export const forecastQuery = (latitude: number, longitude: number) =>
  queryOptions({
    queryKey: ['forecast', coord(latitude), coord(longitude)],
    queryFn: ({ signal }) => fetchForecast(coord(latitude), coord(longitude), signal),
    staleTime: 10 * MINUTE,
    refetchInterval: 15 * MINUTE,
  });

export const airQualityQuery = (latitude: number, longitude: number) =>
  queryOptions({
    queryKey: ['air-quality', coord(latitude), coord(longitude)],
    queryFn: ({ signal }) => fetchAirQuality(coord(latitude), coord(longitude), signal),
    staleTime: 30 * MINUTE,
  });

export const placeSearchQuery = (query: string) =>
  queryOptions({
    queryKey: ['places', query.trim().toLowerCase()],
    queryFn: ({ signal }) => searchPlaces(query.trim(), signal),
    enabled: query.trim().length >= 2,
    staleTime: Infinity,
  });

export const radarQuery = () =>
  queryOptions({
    queryKey: ['radar'],
    queryFn: ({ signal }) => fetchRadarFrames(signal),
    staleTime: 5 * MINUTE,
    refetchInterval: 10 * MINUTE,
  });

export const cityPhotoQuery = (city: string) =>
  queryOptions({
    queryKey: ['city-photo', city.toLowerCase()],
    queryFn: ({ signal }) => fetchCityPhoto(city, signal),
    staleTime: Infinity,
    retry: false,
  });
