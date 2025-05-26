import { useQuery } from '@tanstack/react-query';
import { Wind, Droplets, Sun, CloudSunRain, MapPin, Clock } from 'lucide-react';
import WeatherMetricCard from '../components/WeatherMetricCard';
import ForecastCard from '../components/ForecastCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { useState } from 'react';

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  dt_txt: string;
}


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

const fetchForecast = async (location: string) => {
  const API_KEY = 'a62f5ff2c87dd6aed7e8cb93b9ca09c6';
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch forecast data');
  }
  return response.json();
}

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

const fetchLocalTime = async (lat: number, lon: number) => {
  const res = await fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=GXVY4W4RXDFY&format=json&by=position&lat=${lat}&lng=${lon}`);

  if (!res.ok) {
    throw new Error('Failed to fetch local time');
  }
  return res.json();
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

  const { data: localTimeData } = useQuery({
    queryKey: ['localTime', weatherData?.coord],
    queryFn: () => fetchLocalTime(weatherData.coord.lat, weatherData.coord.lon),
    enabled: !!weatherData?.coord,
  });

  const  { data: forecastData } = useQuery({
    queryKey: ['forecast', inputLocation],
    queryFn: () => fetchForecast(inputLocation),
    enabled: !!inputLocation,
  });

  const dailyForecast = forecastData?.list?.filter((item: ForecastItem) =>
    item.dt_txt.includes("12:00:00")
  ) || [];

  const imageSrc = fullImageUrl || imageData?.small;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pendingLocation.trim()) {
      setInputLocation(pendingLocation.trim());
    }
  };

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
      <div className="absolute inset-0 bg-black/20 z-0" />

      {imageSrc && (
        <img
          src={imageSrc}
          alt={`View of ${inputLocation}`}
          className="absolute inset-0 object-cover w-full h-full z-0 transition-opacity duration-700"
        />
      )}

      <LoadingOverlay isLoading={isLoading} />

      <div className="glass-card max-w-lg w-full mx-4 p-6 space-y-6 z-10 relative bg-black bg-opacity-40 rounded-lg max-w-md md:max-w-4xl w-full">
        <div className="text-center space-y-3">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              className="w-full capitalize p-4 text-center text-white text-xl font-medium bg-white/10 border border-white/30 rounded-xl outline-none placeholder-white/60 focus:border-white/50 focus:bg-white/15 transition-all duration-300"
              placeholder="Enter location"
              value={pendingLocation}
              onChange={(e) => setPendingLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <MapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-white/80">
            <MapPin className="w-4 h-4" />
            <p className="text-sm font-medium">
              {locationName}, {country}
            </p>
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <span className="text-white text-8xl font-thin tracking-tight">{temperature}</span>
                <span className="text-white/80 text-3xl font-light mt-2">°C</span>
              </div>
              <p className="text-white/70 text-lg capitalize font-medium">{weatherDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            {localTimeData && (
              <div className="flex items-center justify-center space-x-2 text-white/70">
                <Clock className="w-4 h-4" />
                <p className="text-sm">
                  Local Time: {new Date(localTimeData.formatted).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold text-center">5-Day Forecast</h3>
            <div className="md:space-y-3 space-y-3 md:overflow-y-auto">
              {dailyForecast && dailyForecast.slice(0, 7).map((item: ForecastItem, index: number) => (
                <ForecastCard key={item.dt} item={item} index={index} />
              ))}
              {!dailyForecast && !isLoading && (
                <p className="text-white/60 text-sm text-center">No forecast data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherComponent;
