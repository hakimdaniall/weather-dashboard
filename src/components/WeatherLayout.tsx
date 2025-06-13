import { MapPin, Clock, Wind, Droplets, Sun, CloudSunRain } from 'lucide-react';
import WeatherMetricCard from './WeatherMetricCard';
import ForecastCard from './ForecastCard';

export default function WeatherLayout({
  imageSrc,
  isLoading,
  pendingLocation,
  setPendingLocation,
  handleKeyDown,
  weatherData,
  forecastData,
  localTime
}: any) {
  const dailyForecast = forecastData?.list?.filter((item: any) =>
    item.dt_txt.includes("12:00:00")
  ) || [];

  const temperature = weatherData ? (weatherData.main.temp - 273.15).toFixed(1) : '--';
  const feelsLike = weatherData ? (weatherData.main.feels_like - 273.15).toFixed(1) : '--';
  const locationName = weatherData?.name || 'Unknown';
  const country = weatherData?.sys?.country || '';
  const humidity = weatherData?.main?.humidity || '--';
  const windSpeed = weatherData?.wind?.speed || '--';
  const cloudiness = weatherData?.clouds?.all || '--';
  const weatherDesc = weatherData?.weather?.[0]?.description || 'Clear sky';

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">
      <div className="absolute inset-0 bg-black/20 z-0" />
      {imageSrc && (
        <img
          src={imageSrc}
          alt={`View of ${locationName}`}
          className="absolute inset-0 object-cover w-full h-full z-0 transition-opacity duration-700"
        />
      )}
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
              <WeatherMetricCard title="Wind" value={windSpeed} unit="km/h" Icon={Wind} />
              <WeatherMetricCard title="Humidity" value={`${humidity}%`} Icon={Droplets} />
              <WeatherMetricCard title="Feels Like" value={`${feelsLike}°C`} Icon={Sun} />
              <WeatherMetricCard title="Cloudiness" value={`${cloudiness}%`} Icon={CloudSunRain} />
            </div>

            {localTime && (
              <div className="flex items-center justify-center space-x-2 text-white/70">
                <Clock className="w-4 h-4" />
                <p className="text-sm">Local Time: {localTime}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 md:!block hidden">
            <h3 className="text-white text-lg font-semibold text-center">5-Day Forecast</h3>
            <div className="md:space-y-3 space-y-3 md:overflow-y-auto">
              {dailyForecast.length > 0
                ? dailyForecast.slice(0, 7).map((item: any, index: number) => (
                    <ForecastCard key={item.dt} item={item} index={index} />
                  ))
                : <p className="text-white/60 text-sm text-center">No forecast data available.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}