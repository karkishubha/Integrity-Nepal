export type Intensity = 'Low' | 'Medium' | 'High';

export interface HeatmapRegion {
  region: string;
  count: number;
  intensity: Intensity;
}

export interface ComplaintCase {
  complaint_text: string;
  corruption_type: 'Bribery' | 'Delay' | 'Fraud' | 'Abuse of Power' | 'Other';
  region: string;
  department: string;
  severity: 'Low' | 'Medium' | 'High';
  summary: string;
}

export interface SummaryResponse {
  total_cases: number;
  distribution_overview: {
    by_corruption_type: Array<{ corruption_type: string; count: number }>;
    by_region: Array<{ region: string; count: number }>;
    by_department: Array<{ department: string; count: number }>;
    by_severity: Array<{ severity: string; count: number }>;
  };
}

export interface QueryResult {
  query: string;
  interpretation: {
    task: 'aggregate' | 'list';
    filter: Record<string, string>;
    group_by: string | null;
    limit: number;
    sort_desc: boolean;
  };
  results: Array<Record<string, string | number>>;
  cases: ComplaintCase[];
  total_matches: number;
  highlight_region: string | null;
  answer: string;
  visual_note: string;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      name?: string;
      shapeName?: string;
      shapeISO?: string;
      shapeGroup?: string;
      shapeType?: string;
      code?: string;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: any;
    };
  }>;
}
