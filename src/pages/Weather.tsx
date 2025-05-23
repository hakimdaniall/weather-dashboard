import { useQuery } from '@tanstack/react-query';
import WeatherMetricCard from '../components/WeatherMetricCard';
import { Wind, CloudSunRain, Droplets, Sun } from "lucide-react";
import { useState } from 'react';

const fetchWeather = async (location: string) => {
  const API_KEY = 'a62f5ff2c87dd6aed7e8cb93b9ca09c6';
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
};

const fetchCityImage = async (city: string) => {
  const UNSPLASH_ACCESS_KEY = 'jcURL4ca79Xgor_8riWxVzPlv_1E0KmB_RDAtkAyNbs';
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${city} landscape&client_id=${UNSPLASH_ACCESS_KEY}&orientation=landscape&per_page=1`);
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return {
      small: data.results[0].urls.small,
      full: data.results[0].urls.full,
    };
  }
  return { small: '', full: '' };
};

const preloadImage = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
  });
};


function WeatherComponent() {
  const [inputLocation, setInputLocation] = useState('Tokyo');
  const [pendingLocation, setPendingLocation] = useState('Tokyo');

  // Fetch weather based on inputLocation
  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', inputLocation],
    queryFn: () => fetchWeather(inputLocation),
    enabled: !!inputLocation,
  });

  const { data: imageData, isLoading: imageLoading } = useQuery({
    queryKey: ['cityImage', inputLocation],
    queryFn: () => fetchCityImage(inputLocation),
    enabled: !!inputLocation,
  });

  const { data: fullImageUrl } = useQuery({
    queryKey: ['fullImage', imageData?.full],
    queryFn: () => preloadImage(imageData!.full),
    enabled: !!imageData?.full,
  });

  const imageSrc = fullImageUrl || imageData?.small;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pendingLocation.trim()) {
      setInputLocation(pendingLocation.trim());
    }
  };

  // Convert temperatures from Kelvin to Celsius if data is present
  const temperature = weatherData ? (weatherData.main.temp - 273.15).toFixed(1) : '--';
  const feelsLike = weatherData ? (weatherData.main.feels_like - 273.15).toFixed(1) : '--';
  const locationName = weatherData?.name || 'Unknown';
  const country = weatherData?.sys?.country || '';
  const humidity = weatherData?.main?.humidity || '--';
  const windSpeed = weatherData?.wind?.speed || '--';
  const cloudiness = weatherData?.clouds?.all || '--';
  const weatherDesc = weatherData?.weather?.[0]?.description || 'Clear sky';

  const isLoading = weatherLoading || imageLoading;

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">

      {/* Background image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={`View of ${inputLocation}`}
          className="background-image fixed inset-0 object-cover w-full h-full z-0 transition-opacity duration-700"
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20"
        style={{ 
          backgroundColor: 'rgb(0 0 0 / 50%)'
        }}
        >
          <div className="animate-spin inline-block size-8 border-3 border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      <div className="glass-card max-w-lg w-full mx-4 p-6 space-y-6 z-10 relative bg-black bg-opacity-40 rounded-lg">
        <div>
          <input
            type="text"
            className="p-2 capitalize text-center text-white text-xl font-medium bg-transparent border-b border-white outline-none placeholder-white placeholder-opacity-60 focus:border-b-2 focus:border-white transition duration-200"
            placeholder="Enter location"
            value={pendingLocation}
            onChange={(e) => setPendingLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <p className="text-white/70 text-sm mt-2">
            {locationName}, {country}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-white text-7xl font-light">{temperature}</span>
          <span className="text-white/80 text-2xl mt-1">°C</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <WeatherMetricCard
            title="Wind"
            value={windSpeed}
            unit="km/h"
            Icon={Wind}
          />
          <WeatherMetricCard
            title="Humidity"
            value={`${humidity}%`}
            Icon={Droplets}
          />
          <WeatherMetricCard
            title="Feels Like"
            value={`${feelsLike}°C`}
            Icon={Sun}
          />
          <WeatherMetricCard
            title="Cloudiness"
            value={`${cloudiness}%`}
            Icon={CloudSunRain}
          />
        </div>

        <div className="text-white/60 text-xs mt-2 capitalize">
          {weatherDesc}
        </div>

        <div className="flex justify-center mt-6">
          <div className="glass-card p-2 rounded-lg">
            <div className="app-dots">
              <div className="app-dot"></div>
              <div className="app-dot"></div>
              <div className="app-dot"></div>
              <div className="app-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherComponent;
