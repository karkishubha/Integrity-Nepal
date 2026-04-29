import type { GeoFeatureCollection, HeatmapRegion, QueryResult, SummaryResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchSummary() {
  return readJson<SummaryResponse>('/summary');
}

export function fetchHeatmapData() {
  return readJson<{ regions: HeatmapRegion[] }>('/heatmap-data');
}

export function fetchRegionCases(region: string) {
  return readJson<{ region: string; cases: any[]; count: number }>(`/cases/${encodeURIComponent(region)}`);
}

export function runQuery(query: string) {
  return readJson<QueryResult>('/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export function fetchNepalGeojson() {
  return readJson<GeoFeatureCollection>('/geojson/nepal-provinces');
}
