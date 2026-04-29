import type { ComplaintCase } from '../types';

type Props = {
  title: string;
  count: number;
  cases: ComplaintCase[];
  emptyMessage: string;
};

export function CasesPanel({ title, count, cases, emptyMessage }: Props) {
  return (
    <section className="panel cases-panel">
      <div className="panel-heading panel-heading-inline">
        <span>{title}</span>
        <span className="panel-count">{count}</span>
      </div>
      <div className="case-list">
        {cases.length === 0 ? (
          <div className="empty-state">{emptyMessage}</div>
        ) : (
          cases.map((item, index) => (
            <article className="case-item" key={`${item.summary}-${index}`}>
              <div className="case-meta">
                <span className={`badge badge-${item.severity.toLowerCase()}`}>{item.severity}</span>
                <span className="case-region">{item.region}</span>
                <span className="case-department">{item.department}</span>
              </div>
              <div className="case-summary">{item.summary}</div>
              <div className="case-text">{item.complaint_text}</div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
