import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  fetchWeather,
  fetchForecast,
  fetchCityImage,
  preloadImage
} from './../lib/fetchers';
import { getLocalTimeNow } from './../lib/helper';
import LoadingOverlay from '../components/LoadingOverlay';
import WeatherLayout from '../components/WeatherLayout';
import SettingsModal from '../components/SettingsModal';
import { Button } from '../components/ui/button';
import { Atom } from 'lucide-react';


export default function WeatherQuery() {
  const [inputLocation, setInputLocation] = useState('Tokyo');
  const [pendingLocation, setPendingLocation] = useState('Tokyo');
  const [staleTime, setStaleTime] = useState<number | undefined>(undefined);

  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', inputLocation],
    queryFn: () => fetchWeather(inputLocation),
    staleTime,
  });

  const { data: forecastData } = useQuery({
    queryKey: ['forecast', inputLocation],
    queryFn: () => fetchForecast(inputLocation),
    staleTime,
  });

  const { data: imageData } = useQuery({
    queryKey: ['cityImage', inputLocation],
    queryFn: () => fetchCityImage(inputLocation),
    staleTime,
  });

  const { data: fullImageUrl } = useQuery({
    queryKey: ['fullImage', imageData?.full],
    queryFn: () => preloadImage(imageData!.full),
    staleTime,
    enabled: !!imageData?.full,
  });

  const imageSrc = fullImageUrl || imageData?.small;
  const localTime = getLocalTimeNow(weatherData?.timezone ?? 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pendingLocation.trim()) {
      setInputLocation(pendingLocation.trim());
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={weatherLoading} />
      <WeatherLayout
        imageSrc={imageSrc}
        isLoading={weatherLoading}
        pendingLocation={pendingLocation}
        setPendingLocation={setPendingLocation}
        handleKeyDown={handleKeyDown}
        weatherData={weatherData}
        forecastData={forecastData}
        localTime={localTime}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => (window.location.href = 'vanilla')}
        className="absolute top-0 left-0 m-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md cursor-pointer"
      >
        <Atom className="h-4 w-4" />
      </Button>
      <SettingsModal staleTime={staleTime} onStaleTimeChange={setStaleTime} />
    </>
  );
}