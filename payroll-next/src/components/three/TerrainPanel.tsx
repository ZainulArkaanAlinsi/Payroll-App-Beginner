'use client';

import dynamic from 'next/dynamic';
import type { TerrainCell } from './CostTerrain';

const CostTerrain = dynamic(() => import('./CostTerrain'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <div className="skeleton size-full" style={{ borderRadius: 14 }} />
    </div>
  ),
});

export default function TerrainPanel(props: {
  cells: TerrainCell[];
  departments: string[];
  periods: string[];
}) {
  return <CostTerrain {...props} />;
}
