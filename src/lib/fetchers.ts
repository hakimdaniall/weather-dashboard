const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export const fetchWeather = async (location: string) => {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
};

export const fetchForecast = async (location: string) => {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
};

export const fetchCityImage = async (city: string) => {
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${city} landscape&client_id=${UNSPLASH_KEY}&orientation=landscape&per_page=1`);
  const data = await res.json();
  if (data.results?.length) {
    return {
      small: data.results[0].urls.small,
      full: data.results[0].urls.full,
    };
  }
  return { small: '', full: '' };
};

export const preloadImage = (src: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
  });