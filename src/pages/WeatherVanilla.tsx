import { useEffect, useState } from 'react';
import {
  fetchWeather,
  fetchForecast,
  fetchCityImage,
  preloadImage,
} from '../lib/fetchers';
import { getLocalTimeNow } from '../lib/helper';
import WeatherLayout from '../components/WeatherLayout';
import LoadingOverlay from '../components/LoadingOverlay';
import { TreePalm } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WeatherVanilla() {
  const [pendingLocation, setPendingLocation] = useState('Tokyo');
  const [currentLocation, setCurrentLocation] = useState('Tokyo');

  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [imageData, setImageData] = useState<{ small: string; full: string }>({ small: '', full: '' });
  const [fullImageUrl, setFullImageUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAll = async (location: string) => {
    setIsLoading(true);
    try {
      const [weather, forecast, image] = await Promise.all([
        fetchWeather(location),
        fetchForecast(location),
        fetchCityImage(location),
      ]);
      setWeatherData(weather);
      setForecastData(forecast);
      setImageData(image);
      if (image.full) {
        const preloaded = await preloadImage(image.full);
        setFullImageUrl(preloaded);
      } else {
        setFullImageUrl('');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setWeatherData(null);
      setForecastData(null);
      setImageData({ small: '', full: '' });
      setFullImageUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(currentLocation);
  }, [currentLocation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pendingLocation.trim()) {
      setCurrentLocation(pendingLocation.trim());
    }
  };

  const imageSrc = fullImageUrl || imageData.small;
  const localTime = getLocalTimeNow(weatherData?.timezone ?? 0);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <WeatherLayout
        imageSrc={imageSrc}
        isLoading={isLoading}
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
        onClick={() => (window.location.href = 'query')}
        className="absolute top-0 left-0 m-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md cursor-pointer"
      >
        <TreePalm className="h-4 w-4" />
      </Button>
    </>
  );
}