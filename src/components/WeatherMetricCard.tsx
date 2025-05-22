
import type { LucideIcon } from "lucide-react";

interface WeatherMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  Icon: LucideIcon;
  subtitle?: string;
}

const WeatherMetricCard = ({ title, value, unit, Icon, subtitle }: WeatherMetricCardProps) => {
  return (
    <div className="weather-metric-card p-4 flex flex-col justify-between space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-white/80 text-sm font-medium">{title}</div>
        <div className="weather-icon text-white/80">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end">
        <div className="text-white text-xl font-semibold">{value}</div>
        {unit && <div className="text-white/80 text-sm ml-1">{unit}</div>}
      </div>
      {subtitle && <div className="text-white/60 text-xs mt-1">{subtitle}</div>}
    </div>
  );
};

export default WeatherMetricCard;