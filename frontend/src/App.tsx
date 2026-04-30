import { useEffect, useState } from 'react';
import { CasesPanel } from './components/CasesPanel';
import { MetricCard } from './components/MetricCard';
import { NepalMap } from './components/NepalMap';
import { QueryPanel } from './components/QueryPanel';
import { FilterDropdown } from './components/FilterDropdown';
import type { ComplaintCase, GeoFeatureCollection, HeatmapRegion, QueryResult, SummaryResponse } from './types';
import { fetchHeatmapData, fetchNepalGeojson, fetchRegionCases, fetchSummary, runQuery } from './api';
import { toCanonicalProvinceName } from './lib/regions';

const EMPTY_SUMMARY: SummaryResponse = {
  total_cases: 0,
  distribution_overview: {
    by_corruption_type: [],
    by_region: [],
    by_department: [],
    by_severity: [],
  },
};

function topCount(items: Array<{ count: number }>) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

export default function App() {
  const [summary, setSummary] = useState<SummaryResponse>(EMPTY_SUMMARY);
  const [regions, setRegions] = useState<HeatmapRegion[]>([]);
  const [geojson, setGeojson] = useState<GeoFeatureCollection | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionCases, setRegionCases] = useState<ComplaintCase[]>([]);
  const [allRegionCases, setAllRegionCases] = useState<ComplaintCase[]>([]);
  const [regionCaseCount, setRegionCaseCount] = useState(0);
  const [provinceFilter, setProvinceFilter] = useState('All provinces');
  const [categoryFilter, setCategoryFilter] = useState('All types');
  const [query, setQuery] = useState('Which region has the highest bribery cases?');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState('Loading intelligence layer...');
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [summaryResponse, heatmapResponse, geojsonResponse] = await Promise.all([
          fetchSummary(),
          fetchHeatmapData(),
          fetchNepalGeojson(),
        ]);
        setSummary(summaryResponse);
        setRegions(heatmapResponse.regions);
        setGeojson(geojsonResponse);
        setStatus('Live dataset ready');

        // Do not auto-select a region on load; let the user pick from the filter
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Failed to load data');
      }
    }

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectRegion(region: string) {
    const canonicalRegion = toCanonicalProvinceName(region);
    setSelectedRegion(canonicalRegion);
    console.log('Selecting region:', region, '-> canonical:', canonicalRegion);
    try {
      const response = await fetchRegionCases(canonicalRegion);
      const cases = (response.cases || []) as ComplaintCase[];
      console.log(`Fetched ${cases.length} cases for ${canonicalRegion}`);
      setAllRegionCases(cases);
      setRegionCaseCount(cases.length);
      // Apply category filter immediately
      if (categoryFilter === 'All types') {
        setRegionCases(cases);
      } else {
        const filtered = cases.filter((c) => c.corruption_type === categoryFilter);
        console.log(`Filtered to ${filtered.length} cases with type "${categoryFilter}"`);
        setRegionCases(filtered);
      }
    } catch (error) {
      console.error('Error fetching region cases for', canonicalRegion, ':', error);
      setAllRegionCases([]);
      setRegionCases([]);
      setRegionCaseCount(0);
    }
  }

  // Re-filter when category changes
  useEffect(() => {
    if (allRegionCases.length === 0) {
      console.log('No cases available to filter');
      return;
    }
    if (categoryFilter === 'All types') {
      console.log('Showing all types:', allRegionCases.length, 'cases');
      setRegionCases(allRegionCases);
    } else {
      const filtered = allRegionCases.filter((c) => c.corruption_type === categoryFilter);
      console.log(`Filtered ${allRegionCases.length} cases to ${filtered.length} with type "${categoryFilter}"`);
      setRegionCases(filtered);
    }
  }, [categoryFilter, allRegionCases]);

  async function handleQuery() {
    if (!query.trim()) {
      return;
    }
    setQueryLoading(true);
    try {
      const response = await runQuery(query.trim());
      setQueryResult(response);
      setHistory((current) => [query.trim(), ...current.filter((item) => item !== query.trim())].slice(0, 6));

      const maybeRegion = response.highlight_region;
      if (maybeRegion) {
        await selectRegion(maybeRegion);
      }
      setStatus(response.answer);
    } catch (error) {
      setQueryResult({
        query,
        interpretation: { task: 'list', filter: {}, group_by: null, limit: 10, sort_desc: true },
        results: [],
        cases: [],
        total_matches: 0,
        highlight_region: null,
        answer: 'No matching answer could be generated for this query.',
        visual_note: 'The visuals below still reflect the current dataset view.',
      });
      setStatus(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  }

  const topRegions = summary.distribution_overview.by_region.slice(0, 3);
  const topTypes = summary.distribution_overview.by_corruption_type.slice(0, 3);
  const selectedRegionData = regions.find((item) => item.region === selectedRegion);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          {logoVisible ? (
            <img src="/logo.jpeg" alt="Nepal Integrity Heatmap logo" className="brand-logo" onError={() => setLogoVisible(false)} />
          ) : (
            <div className="brand-mark">NIH</div>
          )}
          <div>
            <div className="brand-title">Nepal Integrity Heatmap</div>
            <div className="brand-subtitle">AI-powered civic intelligence</div>
          </div>
        </div>

        <button
          className="secondary-button"
          type="button"
          disabled={regions.length === 0}
          onClick={() => {
            const region = regions.find((item) => item.count > 0)?.region ?? regions[0]?.region;
            if (region) {
              selectRegion(region);
            }
          }}
        >
          Focus heatmap
        </button>

        <div className="panel filter-panel">
          <div className="panel-heading">Filters</div>
          <div className="space-y-4">
            <FilterDropdown
              label="Province"
              value={provinceFilter}
              options={['All provinces', ...regions.map((r) => r.region)]}
              onChange={(v) => {
                console.log('Province filter changed to:', v);
                setProvinceFilter(v);
                if (v === 'All provinces') {
                  setSelectedRegion(null);
                  setAllRegionCases([]);
                  setRegionCases([]);
                  setRegionCaseCount(0);
                } else {
                  selectRegion(v);
                }
              }}
            />

            <FilterDropdown
              label="Complaint Type"
              value={categoryFilter}
              options={['All types', ...summary.distribution_overview.by_corruption_type.map((t) => t.corruption_type)]}
              onChange={(v) => {
                console.log('Category filter changed to:', v);
                setCategoryFilter(v);
              }}
            />
          </div>
        </div>

        <QueryPanel
          value={query}
          loading={queryLoading}
          onChange={setQuery}
          onSubmit={handleQuery}
          onExample={setQuery}
        />

        <section className="panel sidebar-panel">
          <div className="panel-heading">Recent queries</div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-state">No queries yet.</div>
            ) : (
              history.map((item) => (
                <button key={item} type="button" className="history-item" onClick={() => setQuery(item)}>
                  {item}
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <main className="main-area">
        <header className="hero-panel panel">
          <div className="hero-copy">
            <div className="eyebrow">Governance data intelligence platform</div>
            <h1>Corruption patterns across Nepal, explained with real complaint data.</h1>
            <p>
              Interactive dashboard visualizing Nepal governance complaints — explore cases by province, corruption type, and severity.
            </p>
            <div className="status-line">{status}</div>
          </div>
          <div className="hero-stats">
            <MetricCard label="Total cases" value={summary.total_cases} tone="sun" />
            <MetricCard label="Heatmap regions" value={regions.length} tone="ember" />
            <MetricCard label="Selected region" value={selectedRegion ?? 'None'} tone="stone" />
          </div>
        </header>

        <section className="stats-grid">
          <MetricCard label="Top regions analyzed" value={topCount(topRegions)} tone="sun" />
          <MetricCard label="Top complaint types" value={topCount(topTypes)} tone="ember" />
          <MetricCard label="Selected region cases" value={regionCaseCount} tone="stone" />
          <MetricCard label="Structured signals" value={summary.distribution_overview.by_department.length} tone="sun" />
        </section>

        <section className="content-grid">
          <NepalMap
            geojson={geojson}
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={selectRegion}
          />

          <section className="panel insight-panel">
            <div className="panel-heading">Current insight</div>
            <div className="query-answer-banner">
              <div className="query-answer-label">Query answer</div>
              <div className="query-answer-text">
                {queryResult?.answer ?? 'Run a question to see a plain-language answer here.'}
              </div>
              <div className="query-answer-note">
                {queryResult?.visual_note ?? 'The visuals below will update to match the answer.'}
              </div>
            </div>
            <div className="insight-block">
              <div className="insight-label">Selected region</div>
              <div className="insight-value">{selectedRegion ?? 'None selected'}</div>
            </div>
            <div className="insight-block">
              <div className="insight-label">Complaint count</div>
              <div className="insight-value">{selectedRegionData?.count ?? 0}</div>
            </div>
            <div className="insight-block">
              <div className="insight-label">Intensity</div>
              <div className={`badge badge-${(selectedRegionData?.intensity ?? 'Low').toLowerCase()}`}>
                {selectedRegionData?.intensity ?? 'Low'}
              </div>
            </div>
            <div className="insight-divider" />
            <div className="insight-list">
              {topRegions.map((item) => (
                <div className="insight-row" key={item.region}>
                  <span>{item.region}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="content-grid lower-grid">
          <CasesPanel
            title={selectedRegion ? `Cases in ${selectedRegion}` : 'Regional cases'}
            count={regionCaseCount}
            cases={regionCases}
            emptyMessage="Select a province to load real complaint cases."
          />

          <section className="panel analytics-panel">
            <div className="panel-heading">Distribution snapshot</div>
            <div className="snapshot-group">
              <div className="snapshot-title">By corruption type</div>
              {summary.distribution_overview.by_corruption_type.slice(0, 5).map((item) => (
                <div className="snapshot-row" key={item.corruption_type}>
                  <span>{item.corruption_type}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
            <div className="snapshot-group">
              <div className="snapshot-title">By severity</div>
              {summary.distribution_overview.by_severity.map((item) => (
                <div className="snapshot-row" key={item.severity}>
                  <span>{item.severity}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
            <div className="query-result">
              <div className="snapshot-title">Latest query result</div>
              {queryResult ? (
                <div>
                  <div className="query-response">
                    <strong>{queryResult.interpretation.task}</strong> with {queryResult.total_matches} matches
                  </div>
                  <div className="query-response-muted">Group by: {queryResult.interpretation.group_by ?? 'none'}</div>
                </div>
              ) : (
                <div className="empty-state">Run a natural-language question to see interpreted filters and matched cases.</div>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
