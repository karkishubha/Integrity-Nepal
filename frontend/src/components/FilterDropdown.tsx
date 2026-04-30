import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type FilterDropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

type MenuPosition = { top: number; left: number; width: number };

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [menuPos, setMenuPos]     = useState<MenuPosition | null>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  // Calculate position relative to viewport each time the menu opens
  const openMenu = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top:   rect.bottom + window.scrollY + 6,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    });
    setIsOpen(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reposition on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    function reposition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top:   rect.bottom + window.scrollY + 6,
        left:  rect.left   + window.scrollX,
        width: rect.width,
      });
    }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  const menu = isOpen && menuPos ? createPortal(
    <div
      ref={menuRef}
      className="filter-dropdown-menu"
      role="listbox"
      style={{
        position: 'absolute',
        top:   menuPos.top,
        left:  menuPos.left,
        width: menuPos.width,
        zIndex: 9999,
      }}
    >
      <div className="filter-dropdown-list">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected={value === option}
            className={`filter-dropdown-option${value === option ? ' selected' : ''}`}
            onClick={() => { onChange(option); setIsOpen(false); }}
          >
            {value === option && (
              <svg className="filter-check-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
              </svg>
            )}
            <span>{option}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="filter-dropdown">
      <label className="filter-dropdown-label">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        className="filter-dropdown-button"
        onClick={() => isOpen ? setIsOpen(false) : openMenu()}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        <svg
          className={`filter-dropdown-chevron${isOpen ? ' open' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {menu}
    </div>
  );
}
