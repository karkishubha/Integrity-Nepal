type Props = {
  label: string;
  value: string | number;
  tone?: 'sun' | 'ember' | 'stone';
};

export function MetricCard({ label, value, tone = 'stone' }: Props) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}
