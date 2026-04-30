import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toCanonicalProvinceName } from '../lib/regions';
import type { GeoFeatureCollection, HeatmapRegion } from '../types';

type Props = {
  geojson: GeoFeatureCollection | null;
  regions: HeatmapRegion[];
  selectedRegion: string | null;
  onSelectRegion: (region: string) => void;
};

const COLOR_MAP: Record<HeatmapRegion['intensity'], string> = {
  Low:    '#f5d76e',
  Medium: '#f59e0b',
  High:   '#ef4444',
};
const SELECTED_COLOR = '#0f766e';

export function NepalMap({ geojson, regions, selectedRegion, onSelectRegion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const layerRef    = useRef<L.GeoJSON | null>(null);
  // Keep latest callback without triggering re-renders
  const onSelectRef = useRef(onSelectRegion);
  onSelectRef.current = onSelectRegion;

  const counts = useMemo(
    () => new Map(regions.map((r) => [r.region, r])),
    [regions]
  );

  // ── ONE effect that owns the full Leaflet lifecycle ──────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Init map (Strict-Mode-safe: check if Leaflet already owns the node) ──
    // React Strict Mode mounts → unmounts → remounts. After the first cleanup,
    // L.map() has already been called and left `_leaflet_id` on the element,
    // so calling it again would throw. We detect this and reuse the container.
    const alreadyHasLeaflet = !!(el as any)._leaflet_id;
    if (!mapRef.current && !alreadyHasLeaflet) {
      const map = L.map(el, {
        center: [28.3, 84.1],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        { maxZoom: 12, minZoom: 5 }
      ).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;
    if (!map) return;

    // ── Remove old province layer ───────────────────────────────────
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // ── Add new province layer (only if geojson is ready) ──────────
    if (geojson) {
      const geoLayer = L.geoJSON(geojson as any, {
        style: (feature) => {
          const props     = feature?.properties as any;
          const rawName   = props?.PR_NAME ?? props?.shapeName ?? props?.name ?? '';
          const canonical = toCanonicalProvinceName(rawName);
          const data      = counts.get(canonical);
          const intensity = data?.intensity ?? 'Low';
          const isSel     = selectedRegion === canonical;
          return {
            fillColor:   isSel ? SELECTED_COLOR : COLOR_MAP[intensity],
            fillOpacity: isSel ? 0.85 : 0.65,
            color:  '#1a2e35',
            weight: isSel ? 2.5 : 1,
            opacity: 1,
          };
        },
        onEachFeature: (feature, layer) => {
          const props     = feature.properties as any;
          const rawName   = props?.PR_NAME ?? props?.shapeName ?? props?.name ?? '';
          const canonical = toCanonicalProvinceName(rawName);
          const data      = counts.get(canonical);

          layer.bindTooltip(
            `<div style="font-family:system-ui,sans-serif;padding:2px 4px;">
               <b style="color:#1a2e35;">${canonical}</b><br/>
               <span style="font-size:11px;color:#64748b;">
                 Cases: ${data?.count ?? 0} · Intensity: ${data?.intensity ?? 'N/A'}
               </span>
             </div>`,
            { sticky: true, direction: 'top', className: 'province-tooltip' }
          );

          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({ weight: 2.5, fillOpacity: 0.9 });
            (layer as any).bringToFront();
          });
          layer.on('mouseout', () => geoLayer.resetStyle(layer));
          layer.on('click',    () => onSelectRef.current(canonical));
        },
      });

      geoLayer.addTo(map);
      layerRef.current = geoLayer;

      try {
        map.fitBounds(geoLayer.getBounds(), { padding: [16, 16] });
      } catch (_) { /* ignore empty-bounds errors */ }
    }

    // ── Cleanup ────────────────────────────────────────────────────────
    // We intentionally do NOT destroy the Leaflet map here because in
    // React Strict Mode the cleanup fires between two consecutive mounts
    // of the same component — destroying and re-creating is wasteful and
    // causes Leaflet to throw on second L.map() call. The map is destroyed
    // only when the whole <NepalMap> component tree is removed from the DOM.
    return () => {
      // Only remove the GeoJSON overlay, leave the base map alive
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
    // Re-run whenever the data that controls rendering changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson, counts, selectedRegion]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <section className="panel map-panel">
      <div className="panel-heading">Nepal heatmap</div>

      {!geojson ? (
        <div className="empty-state">Loading map geometry…</div>
      ) : (
        <div ref={containerRef} className="leaflet-container-wrapper" />
      )}

      <div className="legend-row">
        <LegendItem color={COLOR_MAP.Low}    label="Low" />
        <LegendItem color={COLOR_MAP.Medium} label="Medium" />
        <LegendItem color={COLOR_MAP.High}   label="High" />
        <LegendItem color={SELECTED_COLOR}   label="Selected" />
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
