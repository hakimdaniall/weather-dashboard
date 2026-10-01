import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Place } from '@/lib/api';
import { useSettings } from '@/store/settings';

const DEFAULT_PLACE: Place = {
  id: '1850147',
  name: 'Tokyo',
  latitude: 35.6895,
  longitude: 139.69171,
  country: 'Japan',
  admin1: 'Tokyo',
  countryCode: 'JP',
};

/**
 * The selected place lives in the URL (?lat=…&lon=…&name=…) so every view is shareable
 * and the browser back button moves between cities.
 */
export function usePlace() {
  const [params, setParams] = useSearchParams();
  const addRecent = useSettings((s) => s.addRecent);
  const lastViewed = useSettings((s) => s.recents[0]);

  const lat = params.get('lat');
  const lon = params.get('lon');
  const name = params.get('name');
  const admin1 = params.get('region');
  const country = params.get('country');

  const place = useMemo<Place>(() => {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (lat && lon && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        id: `${latitude},${longitude}`,
        name: name ?? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        latitude,
        longitude,
        admin1: admin1 ?? undefined,
        country: country ?? undefined,
      };
    }
    return lastViewed ?? DEFAULT_PLACE;
  }, [lat, lon, name, admin1, country, lastViewed]);

  const setPlace = useCallback(
    (next: Place) => {
      const search = new URLSearchParams({
        lat: next.latitude.toFixed(4),
        lon: next.longitude.toFixed(4),
        name: next.name,
      });
      if (next.admin1) search.set('region', next.admin1);
      if (next.country) search.set('country', next.country);
      setParams(search);
      addRecent(next);
    },
    [setParams, addRecent],
  );

  return { place, setPlace };
}
