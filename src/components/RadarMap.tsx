import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Pause, Play, Radar } from 'lucide-react';
import type { Place } from '@/lib/api';
import { radarQuery } from '@/lib/queries';
import { formatClock } from '@/lib/format';
import { useSettings } from '@/store/settings';

interface RadarMapProps {
  place: Place;
  /** Radar timestamps are shown in the location's own time. */
  utcOffsetSeconds: number;
  onPick: (latitude: number, longitude: number) => void;
}

const pin = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#fff;border:3px solid #0ea5e9;box-shadow:0 0 0 6px rgba(14,165,233,0.25)"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Live rain radar (RainViewer) with an animated timeline. Click the map to load weather there. */
export default function RadarMap({ place, utcOffsetSeconds, onPick }: RadarMapProps) {
  const { data } = useQuery(radarQuery());
  const timeFormat = useSettings((s) => s.timeFormat);
  const frames = data?.frames ?? [];
  const pastCount = frames.filter((f) => f.time * 1000 <= Date.now()).length;
  const lastPast = Math.max(0, pastCount - 1);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const active = index ?? lastPast;

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => setIndex((i) => ((i ?? lastPast) + 1) % frames.length), 700);
    return () => clearInterval(id);
  }, [playing, frames.length, lastPast]);

  const frame = frames[active];
  // While playing, keep all frames mounted (hidden) so tiles are cached and the animation is smooth.
  const mounted = playing ? frames : frame ? [frame] : [];

  return (
    <section className="glass overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="tile-label">
          <Radar className="size-3.5" /> Rain radar
        </h2>
        <span className="text-xs text-white/50">Click the map to check the weather anywhere</span>
      </div>

      <div className="relative isolate z-0 h-80 sm:h-96">
        <MapContainer
          center={[place.latitude, place.longitude]}
          zoom={6}
          minZoom={3}
          maxZoom={10}
          scrollWheelZoom={false}
          className="size-full"
          attributionControl
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> · Radar <a href="https://www.rainviewer.com/">RainViewer</a>'
            maxNativeZoom={16}
          />
          {data &&
            mounted.map((f) => (
              <TileLayer
                key={f.path}
                url={`${data.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`}
                opacity={f.path === frame?.path ? 0.75 : 0}
                maxNativeZoom={7}
                maxZoom={10}
                zIndex={10}
              />
            ))}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
            zIndex={20}
          />
          <Marker position={[place.latitude, place.longitude]} icon={pin} />
          <Recenter latitude={place.latitude} longitude={place.longitude} />
          <ClickHandler onPick={onPick} />
        </MapContainer>

        {frames.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 z-[1000] flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause radar animation' : 'Play radar animation'}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-slate-900 transition hover:scale-105"
            >
              {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
            </button>
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={active}
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
              aria-label="Radar time"
              className="h-1 flex-1 cursor-pointer accent-white"
            />
            <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums">
              {frame && formatClock(new Date((frame.time + utcOffsetSeconds) * 1000), timeFormat)}
              <span className="ml-1 text-white/50">{active > lastPast ? 'fcst' : active === lastPast ? 'now' : ''}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 6), { duration: 1.2 });
  }, [map, latitude, longitude]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}
