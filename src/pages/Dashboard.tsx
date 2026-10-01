import { lazy, Suspense, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { CloudOff, Loader2, LocateFixed, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { reverseGeocode } from '@/lib/api';
import { airQualityQuery, cityPhotoQuery, forecastQuery } from '@/lib/queries';
import { describeWeather } from '@/lib/weather-codes';
import { usePlace } from '@/hooks/usePlace';
import { useGeolocate } from '@/hooks/useGeolocate';
import { hasPhotoSupport } from '@/lib/api';
import Background from '@/components/Background';
import SearchCommand from '@/components/SearchCommand';
import SettingsPopover from '@/components/SettingsPopover';
import SavedCities from '@/components/SavedCities';
import CurrentConditions from '@/components/CurrentConditions';
import HourlyForecast from '@/components/HourlyForecast';
import DailyForecast from '@/components/DailyForecast';
import DetailTiles from '@/components/DetailTiles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Leaflet is ~150 kB, so the radar map is split into its own chunk.
const RadarMap = lazy(() => import('@/components/RadarMap'));

export default function Dashboard() {
  const { place, setPlace } = usePlace();
  const queryClient = useQueryClient();
  const geolocate = useGeolocate(setPlace);

  // keepPreviousData: while a new city loads, keep showing the last one (dimmed) instead of a blank screen.
  const forecast = useQuery({ ...forecastQuery(place.latitude, place.longitude), placeholderData: keepPreviousData });
  const airQuality = useQuery({ ...airQualityQuery(place.latitude, place.longitude), placeholderData: keepPreviousData });
  const photo = useQuery({ ...cityPhotoQuery(place.name), enabled: hasPhotoSupport });

  const data = forecast.data;
  const switching = forecast.isPlaceholderData;

  // While the next city loads, the previous city's data stays on screen — so keep its name too.
  const [shownPlace, setShownPlace] = useState(place);
  if (!switching && data && shownPlace !== place) setShownPlace(place);
  const weather = data ? describeWeather(data.current.weatherCode, data.current.isDay) : null;

  const pickFromMap = async (latitude: number, longitude: number) => {
    const id = toast.loading('Looking up location…');
    const picked = await reverseGeocode(latitude, longitude);
    toast.dismiss(id);
    setPlace(picked);
  };

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['forecast'] });
    void queryClient.invalidateQueries({ queryKey: ['air-quality'] });
  };

  return (
    <>
      <Background
        condition={weather?.condition ?? 'partly'}
        isDay={data?.current.isDay ?? true}
        photoUrl={switching ? undefined : photo.data}
      />

      {/* Thin progress bar while switching cities */}
      <AnimatePresence>
        {switching && (
          <motion.div
            className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-white"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.85, transition: { duration: 2, ease: 'easeOut' } }}
            exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3 } }}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <header className="flex items-center gap-3">
          <a href="/" className="mr-auto hidden shrink-0 items-center gap-2.5 sm:flex">
            <img src="/weather.svg" alt="" className="size-8" />
            <span className="text-lg font-semibold tracking-tight">Skycast</span>
          </a>
          <div className="flex flex-1 justify-center sm:flex-none">
            <SearchCommand onSelect={setPlace} onLocate={() => geolocate.mutate()} isLocating={geolocate.isPending} />
          </div>
          <button
            type="button"
            onClick={() => geolocate.mutate()}
            disabled={geolocate.isPending}
            aria-label="Use my location"
            title="Use my location"
            className="glass flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-white/80 transition hover:bg-white/12 hover:text-white"
          >
            {geolocate.isPending ? <Loader2 className="size-[18px] animate-spin" /> : <LocateFixed className="size-[18px]" />}
          </button>
          <SettingsPopover />
        </header>

        <SavedCities current={place} onSelect={setPlace} />

        {forecast.isError && !data ? (
          <ErrorState message={(forecast.error as Error).message} onRetry={() => forecast.refetch()} />
        ) : !data ? (
          <LoadingState />
        ) : (
          <main className={cn('grid gap-5 transition-opacity duration-300 lg:grid-cols-12', switching && 'opacity-60')}>
            <div className="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
              <CurrentConditions
                place={shownPlace}
                forecast={data}
                updatedAt={forecast.dataUpdatedAt}
                isFetching={forecast.isFetching}
                onRefresh={refresh}
              />
              <DailyForecast forecast={data} />
            </div>
            <div className="flex min-w-0 flex-col gap-5 lg:col-span-7 xl:col-span-8">
              <HourlyForecast forecast={data} />
              <DetailTiles forecast={data} airQuality={airQuality.data} airQualityLoading={airQuality.isPending} />
              <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
                <RadarMap place={place} utcOffsetSeconds={data.utcOffsetSeconds} onPick={pickFromMap} />
              </Suspense>
            </div>
          </main>
        )}

        <footer className="mt-auto pt-4 text-center text-xs text-white/45">
          Weather & air quality by{' '}
          <a className="underline-offset-2 hover:underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          · Radar by{' '}
          <a className="underline-offset-2 hover:underline" href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">
            RainViewer
          </a>{' '}
          · Icons by{' '}
          <a className="underline-offset-2 hover:underline" href="https://github.com/basmilius/weather-icons" target="_blank" rel="noreferrer">
            Meteocons
          </a>
        </footer>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Loading weather">
      <div className="flex flex-col gap-5 lg:col-span-5 xl:col-span-4">
        <Skeleton className="h-[22rem] rounded-3xl" />
        <Skeleton className="h-[30rem] rounded-3xl" />
      </div>
      <div className="flex flex-col gap-5 lg:col-span-7 xl:col-span-8">
        <Skeleton className="h-64 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <CloudOff className="size-10 text-white/70" />
      <h2 className="text-lg font-semibold">Couldn't load the weather</h2>
      <p className="text-sm text-white/60">{message}. Check your connection and try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white/90"
      >
        <RotateCw className="size-4" /> Try again
      </button>
    </div>
  );
}
