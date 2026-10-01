import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reverseGeocode, type Place } from '@/lib/api';

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    });
  });
}

/** "Use my location" as a TanStack mutation: gives us isPending/error state for free. */
export function useGeolocate(onFound: (place: Place) => void) {
  return useMutation({
    mutationFn: async () => {
      const { coords } = await getPosition();
      return reverseGeocode(coords.latitude, coords.longitude);
    },
    onSuccess: (place) => {
      onFound(place);
      toast.success(`Showing weather for ${place.name}`);
    },
    onError: (error) => {
      const denied = (error as unknown as GeolocationPositionError).code === 1;
      toast.error(denied ? 'Location permission was denied' : 'Could not determine your location');
    },
  });
}
