import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  label,
  items = [],
  triggerIcon: TriggerIcon,
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  useEffect(() => {
    if (open && focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex].focus();
    }
  }, [open, focusIndex]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusIndex >= 0 && items[focusIndex] && !items[focusIndex].disabled) {
          items[focusIndex].onClick?.();
          close();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ui-toolbar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        {TriggerIcon && <TriggerIcon size={20} aria-hidden="true" />}
        <span>{label}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && (
        <ul
          role="menu"
          aria-label={label}
          className="absolute z-50 mt-2 min-w-[200px] py-2 rounded-[var(--radius-md)] overflow-hidden"
          style={{
            [align === 'right' ? 'right' : 'left']: 0,
            backgroundColor: 'var(--paper-surface)',
            border: 'var(--border-crayon-light)',
            boxShadow: 'var(--shadow-paper)',
          }}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <li key={item.id || idx} role="none">
                <button
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  tabIndex={focusIndex === idx ? 0 : -1}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      close();
                    }
                  }}
                  className={`ui-menu-item ${item.danger ? 'ui-menu-item--danger' : ''}`}
                >
                  {Icon && <Icon size={20} aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
