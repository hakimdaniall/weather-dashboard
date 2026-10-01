import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Segmented } from '@/components/ui/segmented';
import { useSettings } from '@/store/settings';

export default function SettingsPopover() {
  const { tempUnit, windUnit, timeFormat, setTempUnit, setWindUnit, setTimeFormat } = useSettings();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Settings"
          className="glass flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-white/80 transition hover:bg-white/12 hover:text-white"
        >
          <Settings2 className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4 border-white/15 bg-slate-900/90">
        <p className="text-sm font-semibold">Units</p>
        <Field label="Temperature">
          <Segmented
            aria-label="Temperature unit"
            value={tempUnit}
            onChange={setTempUnit}
            options={[
              { value: 'c', label: '°C' },
              { value: 'f', label: '°F' },
            ]}
          />
        </Field>
        <Field label="Wind speed">
          <Segmented
            aria-label="Wind speed unit"
            value={windUnit}
            onChange={setWindUnit}
            options={[
              { value: 'kmh', label: 'km/h' },
              { value: 'mph', label: 'mph' },
              { value: 'ms', label: 'm/s' },
              { value: 'kn', label: 'kn' },
            ]}
          />
        </Field>
        <Field label="Time format">
          <Segmented
            aria-label="Time format"
            value={timeFormat}
            onChange={setTimeFormat}
            options={[
              { value: '24h', label: '24-hour' },
              { value: '12h', label: '12-hour' },
            ]}
          />
        </Field>
      </PopoverContent>
    </Popover>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-white/55">{label}</p>
      {children}
    </div>
  );
}
