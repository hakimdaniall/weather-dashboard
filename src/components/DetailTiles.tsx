import type { LucideIcon } from 'lucide-react';
import { Droplets, Eye, Gauge, Leaf, Sun, Sunrise, Thermometer, Umbrella, Wind } from 'lucide-react';
import type { AirQuality, Forecast } from '@/lib/api';
import {
  compassDirection,
  formatLocalTime,
  formatTemp,
  nowIsoAt,
  parseLocal,
  toWind,
  windLabel,
} from '@/lib/format';
import { useSettings } from '@/store/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { useNow } from '@/hooks/useNow';

interface DetailTilesProps {
  forecast: Forecast;
  airQuality?: AirQuality;
  airQualityLoading: boolean;
}

export default function DetailTiles({ forecast, airQuality, airQualityLoading }: DetailTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      <UvTile forecast={forecast} />
      <WindTile forecast={forecast} />
      <SunTile forecast={forecast} />
      <AirQualityTile airQuality={airQuality} loading={airQualityLoading} />
      <FeelsLikeTile forecast={forecast} />
      <HumidityTile forecast={forecast} />
      <PrecipitationTile forecast={forecast} />
      <VisibilityTile forecast={forecast} />
    </div>
  );
}

function Tile({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="glass flex min-h-40 flex-col rounded-2xl p-4">
      <h3 className="tile-label mb-2">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <p className="text-3xl font-medium tracking-tight tabular-nums">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-auto pt-2 text-xs leading-snug text-white/65">{children}</p>;
}

/** A thin scale with a marker; `value` is 0–1. Color carries meaning, but the label above always says it in words. */
function Scale({ value, gradient }: { value: number; gradient: string }) {
  return (
    <div className="relative mt-3 h-1.5 rounded-full" style={{ backgroundImage: gradient }}>
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/70 bg-white shadow"
        style={{ left: `${Math.min(1, Math.max(0, value)) * 100}%` }}
      />
    </div>
  );
}

/* ---------- UV ---------- */

function uvLevel(uv: number) {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

function UvTile({ forecast }: { forecast: Forecast }) {
  const uv = forecast.current.uvIndex;
  const max = forecast.daily[0].uvIndexMax;
  return (
    <Tile icon={Sun} title="UV index">
      <Big>{Math.round(uv)}</Big>
      <p className="text-sm font-medium">{uvLevel(uv)}</p>
      <Scale value={uv / 11} gradient="linear-gradient(90deg,#4ade80,#facc15,#fb923c,#ef4444,#a855f7)" />
      <Note>
        {max >= 3 ? `Peaks at ${Math.round(max)} today — sun protection advised.` : `Low all day (max ${Math.round(max)}).`}
      </Note>
    </Tile>
  );
}

/* ---------- Wind ---------- */

function WindTile({ forecast }: { forecast: Forecast }) {
  const windUnit = useSettings((s) => s.windUnit);
  const { windSpeed, windGusts, windDirection } = forecast.current;
  return (
    <Tile icon={Wind} title="Wind">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Big>{toWind(windSpeed, windUnit)}</Big>
          <p className="text-xs text-white/65">{windLabel(windUnit)}</p>
        </div>
        <Compass degrees={windDirection} />
      </div>
      <Note>
        From {compassDirection(windDirection)} · gusts {toWind(windGusts, windUnit)} {windLabel(windUnit)}
      </Note>
    </Tile>
  );
}

function Compass({ degrees }: { degrees: number }) {
  // Wind direction is where the wind comes FROM; the arrow points where it blows TO.
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0" role="img" aria-label={`Wind from ${compassDirection(degrees)}`}>
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {Array.from({ length: 36 }, (_, i) => (
        <line
          key={i}
          x1="32"
          y1="4"
          x2="32"
          y2={i % 9 === 0 ? 9 : 6.5}
          stroke={i % 9 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="1"
          transform={`rotate(${i * 10} 32 32)`}
        />
      ))}
      {['N', 'E', 'S', 'W'].map((d, i) => (
        <text
          key={d}
          x="32"
          y="16"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="600"
          fill="rgba(255,255,255,0.65)"
          transform={`rotate(${i * 90} 32 32) rotate(${-i * 90} 32 14)`}
        >
          {d}
        </text>
      ))}
      <g style={{ transform: `rotate(${degrees + 180}deg)`, transformOrigin: '32px 32px', transition: 'transform 0.8s ease' }}>
        <line x1="32" y1="46" x2="32" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 15 L27 23 L37 23 Z" fill="white" />
        <circle cx="32" cy="46" r="2.5" fill="white" />
      </g>
    </svg>
  );
}

/* ---------- Sunrise / sunset ---------- */

function SunTile({ forecast }: { forecast: Forecast }) {
  const timeFormat = useSettings((s) => s.timeFormat);
  useNow(60_000);
  const [today, tomorrow] = forecast.daily;
  const now = nowIsoAt(forecast.utcOffsetSeconds);

  const rise = parseLocal(today.sunrise).getTime();
  const set = parseLocal(today.sunset).getTime();
  const t = parseLocal(now).getTime();
  const progress = (t - rise) / (set - rise);
  const isUp = progress >= 0 && progress <= 1;

  // Semicircle arc from (8,44) to (88,44); sun sits on it when it's up.
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, progress)));
  const sx = 48 + 40 * Math.cos(angle);
  const sy = 44 - 40 * Math.sin(angle);

  const next = progress < 0 ? { label: 'Sunrise', time: today.sunrise } : isUp ? { label: 'Sunset', time: today.sunset } : { label: 'Sunrise', time: tomorrow?.sunrise ?? today.sunrise };
  const daylight = (set - rise) / 3_600_000;

  return (
    <Tile icon={Sunrise} title={next.label}>
      <Big>{formatLocalTime(next.time, timeFormat)}</Big>
      <svg viewBox="0 0 96 50" className="mt-1 w-full" aria-hidden>
        <path d="M8 44 A40 40 0 0 1 88 44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="2 3" />
        {isUp && (
          <path
            d={`M8 44 A40 40 0 0 1 ${sx.toFixed(2)} ${sy.toFixed(2)}`}
            fill="none"
            stroke="#fde68a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        <line x1="2" y1="44" x2="94" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        {isUp && <circle cx={sx} cy={sy} r="4.5" fill="#fde68a" stroke="#0f172a" strokeOpacity={0.4} strokeWidth="1.5" />}
      </svg>
      <Note>
        {next.label === 'Sunset'
          ? `Sunrise was ${formatLocalTime(today.sunrise, timeFormat)}`
          : `Sunset ${formatLocalTime(today.sunset, timeFormat)}`}
        {' · '}
        {Math.floor(daylight)}h {Math.round((daylight % 1) * 60)}m daylight
      </Note>
    </Tile>
  );
}

/* ---------- Air quality ---------- */

function aqiLevel(aqi: number) {
  if (aqi <= 50) return { label: 'Good', note: 'Air quality is satisfactory.' };
  if (aqi <= 100) return { label: 'Moderate', note: 'Acceptable; sensitive people may be affected.' };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', note: 'Sensitive groups should limit outdoor exertion.' };
  if (aqi <= 200) return { label: 'Unhealthy', note: 'Everyone may begin to feel health effects.' };
  if (aqi <= 300) return { label: 'Very unhealthy', note: 'Health alert: avoid prolonged outdoor exertion.' };
  return { label: 'Hazardous', note: 'Stay indoors if possible.' };
}

function AirQualityTile({ airQuality, loading }: { airQuality?: AirQuality; loading: boolean }) {
  if (loading) {
    return (
      <Tile icon={Leaf} title="Air quality">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-4 w-24" />
      </Tile>
    );
  }
  if (!airQuality || airQuality.usAqi == null) {
    return (
      <Tile icon={Leaf} title="Air quality">
        <p className="text-sm text-white/60">Not available for this location.</p>
      </Tile>
    );
  }
  const level = aqiLevel(airQuality.usAqi);
  return (
    <Tile icon={Leaf} title="Air quality">
      <Big>{Math.round(airQuality.usAqi)}</Big>
      <p className="text-sm leading-tight font-medium">{level.label}</p>
      <Scale value={airQuality.usAqi / 300} gradient="linear-gradient(90deg,#4ade80,#facc15 17%,#fb923c 33%,#ef4444 50%,#a855f7 67%,#881337)" />
      <Note>
        US AQI · PM2.5 {Math.round(airQuality.pm2_5)} µg/m³
      </Note>
    </Tile>
  );
}

/* ---------- Feels like ---------- */

function FeelsLikeTile({ forecast }: { forecast: Forecast }) {
  const tempUnit = useSettings((s) => s.tempUnit);
  const { apparentTemperature: feels, temperature, humidity, windSpeed } = forecast.current;
  const diff = feels - temperature;
  let note = 'Similar to the actual temperature.';
  if (diff >= 2) note = humidity > 60 ? 'Humidity is making it feel warmer.' : 'Feels warmer than the actual temperature.';
  if (diff <= -2) note = windSpeed > 15 ? 'Wind is making it feel colder.' : 'Feels colder than the actual temperature.';
  return (
    <Tile icon={Thermometer} title="Feels like">
      <Big>{formatTemp(feels, tempUnit)}</Big>
      <Note>{note}</Note>
    </Tile>
  );
}

/* ---------- Humidity ---------- */

function HumidityTile({ forecast }: { forecast: Forecast }) {
  const tempUnit = useSettings((s) => s.tempUnit);
  const { humidity, dewPoint } = forecast.current;
  return (
    <Tile icon={Droplets} title="Humidity">
      <Big>{humidity}%</Big>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
        <div className="h-full rounded-full bg-sky-300" style={{ width: `${humidity}%` }} />
      </div>
      <Note>The dew point is {formatTemp(dewPoint, tempUnit)} right now.</Note>
    </Tile>
  );
}

/* ---------- Precipitation ---------- */

function PrecipitationTile({ forecast }: { forecast: Forecast }) {
  const [today, tomorrow] = forecast.daily;
  return (
    <Tile icon={Umbrella} title="Precipitation">
      <Big>
        {today.precipitationSum.toFixed(today.precipitationSum < 10 ? 1 : 0)}
        <span className="ml-1 text-base text-white/65">mm</span>
      </Big>
      <p className="text-sm font-medium">today</p>
      <Note>
        {today.precipitationProbability}% chance today
        {tomorrow && ` · ${tomorrow.precipitationSum.toFixed(1)} mm expected tomorrow`}
      </Note>
    </Tile>
  );
}

/* ---------- Visibility & pressure ---------- */

function VisibilityTile({ forecast }: { forecast: Forecast }) {
  const tempUnit = useSettings((s) => s.tempUnit);
  const { visibility, pressure } = forecast.current;
  const km = visibility / 1000;
  const value = tempUnit === 'f' ? km * 0.621371 : km;
  const unit = tempUnit === 'f' ? 'mi' : 'km';
  const note = km >= 10 ? 'Perfectly clear view.' : km >= 4 ? 'Light haze is reducing visibility.' : 'Visibility is poor.';
  return (
    <Tile icon={Eye} title="Visibility">
      <Big>
        {value >= 10 ? Math.round(value) : value.toFixed(1)}
        <span className="ml-1 text-base text-white/65">{unit}</span>
      </Big>
      <Note>
        {note}
        <span className="mt-1 flex items-center gap-1 text-white/55">
          <Gauge className="size-3" /> {Math.round(pressure)} hPa pressure
        </span>
      </Note>
    </Tile>
  );
}
