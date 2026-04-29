import { ChangeEvent, FormEvent } from 'react';

type Props = {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onExample: (value: string) => void;
};

const EXAMPLES = [
  'Which region has the highest bribery cases?',
  'Show abuse of power cases in Bagmati Province',
  'What departments have the most fraud reports?',
];

export function QueryPanel({ value, loading, onChange, onSubmit, onExample }: Props) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="panel query-panel">
      <div className="panel-heading">Natural language query</div>
      <form className="query-form" onSubmit={handleSubmit}>
        <textarea
          value={value}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
          placeholder="Ask a governance question, for example: Which region has the highest bribery cases?"
          rows={4}
        />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Run query'}
        </button>
      </form>
      <div className="example-row">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" className="example-chip" onClick={() => onExample(example)}>
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
