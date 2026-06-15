'use client';
import { Navigation } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import RadiusFilter from '../RadiusFilter';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
}

export default function SectionLocation({ f, set, activeCount }: Props) {
  return (
    <FilterAccordion
      icon={<Navigation size={16} />}
      title="القرب الجغرافي"
      activeCount={activeCount}
    >
      <RadiusFilter
        radiusKm={f.radiusKm}
        searchLat={f.searchLat}
        searchLon={f.searchLon}
        onChange={(radius, lat, lon) => {
          set('radiusKm',  radius);
          set('searchLat', lat);
          set('searchLon', lon);
        }}
      />
    </FilterAccordion>
  );
}