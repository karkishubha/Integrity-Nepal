import { useState, useRef, useEffect } from 'react';

type FilterDropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white/90 hover:bg-white text-ink rounded-lg border border-black/10 hover:border-black/20 font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0"
        aria-expanded={isOpen}
      >
        <span className="truncate">{value}</span>
        <svg
          className={`w-5 h-5 text-ink/50 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-black/10 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="max-h-72 overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={option}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                  value === option
                    ? 'bg-accent/15 text-accent'
                    : 'text-ink hover:bg-black/5'
                } ${index === 0 ? 'border-b border-black/5' : ''}`}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {value === option && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

