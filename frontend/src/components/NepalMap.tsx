import { geoMercator, geoPath } from 'd3-geo';
import { toCanonicalProvinceName } from '../lib/regions';
import type { GeoFeatureCollection, HeatmapRegion } from '../types';

type Props = {
  geojson: GeoFeatureCollection | null;
  regions: HeatmapRegion[];
  selectedRegion: string | null;
  onSelectRegion: (region: string) => void;
};

const COLOR_MAP: Record<HeatmapRegion['intensity'], string> = {
  Low: '#f5d76e',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export function NepalMap({ geojson, regions, selectedRegion, onSelectRegion }: Props) {
  if (!geojson) {
    return (
      <section className="panel map-panel">
        <div className="panel-heading">Nepal heatmap</div>
        <div className="empty-state">Loading map geometry...</div>
      </section>
    );
  }

  const projection = geoMercator().fitSize([720, 480], geojson as never);
  const path = geoPath(projection);
  const counts = new Map(regions.map((item) => [item.region, item]));

  return (
    <section className="panel map-panel">
      <div className="panel-heading">Nepal heatmap</div>
      <svg viewBox="0 0 720 480" className="map-svg" role="img" aria-label="Nepal heatmap">
        <defs>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.18" />
          </filter>
        </defs>
        {geojson.features.map((feature) => {
          const rawRegionName = feature.properties.shapeName ?? feature.properties.name ?? '';
          const regionName = toCanonicalProvinceName(rawRegionName);
          const regionData = counts.get(regionName);
          const intensity = regionData?.intensity ?? 'Low';
          const isSelected = selectedRegion === regionName;
          const pathData = path(feature as never) ?? '';
          return (
            <path
              key={rawRegionName || regionName}
              d={pathData}
              onClick={() => onSelectRegion(regionName)}
              className={`province-path province-${intensity.toLowerCase()} ${isSelected ? 'province-selected' : ''}`}
              style={{ fill: COLOR_MAP[intensity] }}
            />
          );
        })}
      </svg>
      <div className="legend-row">
        <LegendItem color={COLOR_MAP.Low} label="Low" />
        <LegendItem color={COLOR_MAP.Medium} label="Medium" />
        <LegendItem color={COLOR_MAP.High} label="High" />
      </div>
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-swatch" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
