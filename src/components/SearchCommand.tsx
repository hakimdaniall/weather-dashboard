import { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, LocateFixed, MapPin, Search, Star, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Place } from '@/lib/api';
import { forecastQuery, placeSearchQuery } from '@/lib/queries';
import { placeSubtitle } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSettings } from '@/store/settings';

interface SearchCommandProps {
  onSelect: (place: Place) => void;
  onLocate: () => void;
  isLocating: boolean;
}

const flag = (code?: string) =>
  code && code.length === 2
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : null;

export default function SearchCommand({ onSelect, onLocate, isLocating }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const query = useDebouncedValue(input, 250);
  const queryClient = useQueryClient();
  const favorites = useSettings((s) => s.favorites);
  const recents = useSettings((s) => s.recents);
  const clearRecents = useSettings((s) => s.clearRecents);

  const { data: results = [], isFetching, isError } = useQuery(placeSearchQuery(query));

  // ⌘K / Ctrl+K or "/" opens the palette from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Every place shown in the palette, keyed by its cmdk item value, so the highlighted one
  // can be prefetched — by the time Enter is pressed the forecast is usually already cached.
  const byValue = useMemo(() => {
    const map = new Map<string, Place>();
    favorites.forEach((p) => map.set(`fav-${p.id}`, p));
    recents.forEach((p) => map.set(`recent-${p.id}`, p));
    results.forEach((p) => map.set(`result-${p.id}`, p));
    return map;
  }, [favorites, recents, results]);

  const prefetch = (value: string) => {
    const place = byValue.get(value);
    if (place) void queryClient.prefetchQuery(forecastQuery(place.latitude, place.longitude));
  };

  const choose = (place: Place) => {
    onSelect(place);
    setOpen(false);
    setInput('');
  };

  const showSuggestions = input.trim().length < 2;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass group flex h-11 w-full max-w-md cursor-pointer items-center gap-3 rounded-2xl px-4 text-left text-sm text-white/60 transition hover:bg-white/12 hover:text-white/80"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search for a city…</span>
        <kbd className="hidden rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-white/60 sm:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] translate-y-0 gap-0 overflow-hidden rounded-2xl border-white/15 bg-slate-900/90 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search for a city</DialogTitle>
          <Command shouldFilter={false} loop onValueChange={prefetch} className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              {isFetching ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-white/50" />
              ) : (
                <Search className="size-4 shrink-0 text-white/50" />
              )}
              <Command.Input
                value={input}
                onValueChange={setInput}
                placeholder="Search for a city…"
                className="h-14 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40"
              />
              <DialogPrimitive.Close className="cursor-pointer rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/45 [&_[cmdk-group-heading]]:uppercase">
              {!showSuggestions && !isFetching && (
                <Command.Empty className="py-10 text-center text-sm text-white/50">
                  {isError ? 'Search is unavailable right now.' : `No cities found for “${input}”.`}
                </Command.Empty>
              )}

              {showSuggestions && (
                <Command.Group>
                  <Item value="locate" onSelect={() => { onLocate(); setOpen(false); }}>
                    {isLocating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                    <span>Use my current location</span>
                  </Item>
                </Command.Group>
              )}

              {showSuggestions && favorites.length > 0 && (
                <Command.Group heading="Saved">
                  {favorites.map((p) => (
                    <PlaceItem key={p.id} value={`fav-${p.id}`} place={p} icon={<Star className="size-4 fill-amber-300 text-amber-300" />} onSelect={choose} />
                  ))}
                </Command.Group>
              )}

              {showSuggestions && recents.length > 0 && (
                <Command.Group
                  heading={
                    <div className="flex items-center justify-between">
                      <span>Recent</span>
                      <button
                        type="button"
                        onClick={clearRecents}
                        className="cursor-pointer text-[11px] font-medium tracking-normal normal-case text-white/45 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  }
                >
                  {recents.map((p) => (
                    <PlaceItem key={p.id} value={`recent-${p.id}`} place={p} icon={<Clock className="size-4" />} onSelect={choose} />
                  ))}
                </Command.Group>
              )}

              {!showSuggestions && results.length > 0 && (
                <Command.Group heading="Cities">
                  {results.map((p) => (
                    <PlaceItem
                      key={p.id}
                      value={`result-${p.id}`}
                      place={p}
                      icon={<span className="w-4 text-center text-base leading-none">{flag(p.countryCode) ?? <MapPin className="size-4" />}</span>}
                      onSelect={choose}
                    />
                  ))}
                </Command.Group>
              )}
            </Command.List>

            <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 text-[11px] text-white/40">
              <span><kbd className="font-sans">↑↓</kbd> navigate</span>
              <span><kbd className="font-sans">↵</kbd> select</span>
              <span><kbd className="font-sans">esc</kbd> close</span>
              <span className="ml-auto">Geocoding by Open-Meteo</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Item({ children, ...props }: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      {...props}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/85 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
    >
      {children}
    </Command.Item>
  );
}

function PlaceItem({
  place,
  value,
  icon,
  onSelect,
}: {
  place: Place;
  value: string;
  icon: React.ReactNode;
  onSelect: (place: Place) => void;
}) {
  const subtitle = placeSubtitle(place);
  return (
    <Item value={value} onSelect={() => onSelect(place)}>
      <span className="flex size-4 items-center justify-center text-white/60">{icon}</span>
      <span className="truncate font-medium">{place.name}</span>
      {subtitle && <span className="truncate text-white/45">{subtitle}</span>}
    </Item>
  );
}
