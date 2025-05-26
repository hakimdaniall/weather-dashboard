
import React from 'react';

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
}

interface ForecastCardProps {
  item: ForecastItem;
  index: number;
}

const ForecastCard: React.FC<ForecastCardProps> = ({ item, index }) => {
  const date = new Date(item.dt * 1000);
  const dayName = date.toLocaleDateString('en', { weekday: 'short' });
  const dayDate = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return (
    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4 transition-all duration-300 hover:bg-white/15">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white font-medium">{index === 0 ? 'Tomorrow' : dayName}</p>
          <p className="text-white/60 text-sm">{dayDate}</p>
        </div>
        
        <div className="flex-1 text-center">
          <p className="text-white/80 text-sm capitalize">{item.weather[0].description}</p>
        </div>
        
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end space-x-2">
            <span className="text-white font-semibold">
              {(item.main.temp - 273.15).toFixed(1)} °C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastCard;