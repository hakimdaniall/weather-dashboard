import { describeWeather } from '@/lib/weather-codes';
import { cn } from '@/lib/utils';

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
}

/** Animated Meteocons SVG for a WMO weather code. */
export default function WeatherIcon({ code, isDay = true, className }: WeatherIconProps) {
  const { icon, label } = describeWeather(code, isDay);
  return <img src={icon} alt={label} title={label} draggable={false} className={cn('size-10 select-none', className)} />;
}
