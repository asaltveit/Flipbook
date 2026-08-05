import React, { useId } from 'react';

const PRESETS = [
  { id: 'snail', label: 'Snail', value: 1500 },
  { id: 'normal', label: 'Normal', value: 500 },
  { id: 'sprint', label: 'Sprint', value: 150 },
];

export default function Slider({ label, value, onChange, min = 100, max = 2000, step = 50 }) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-3 text-center"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {label}: {value}ms
      </label>

      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {PRESETS.map((preset) => {
          const isActive = value === preset.value;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.value)}
              className="ui-preset-btn"
              aria-pressed={isActive}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="ui-focus w-full cursor-pointer"
        style={{
          height: '12px',
          borderRadius: 'var(--radius-pill)',
          appearance: 'none',
          background: `linear-gradient(to right, var(--crayon-blue) 0%, var(--crayon-blue) ${pct}%, var(--paper-surface-alt) ${pct}%, var(--paper-surface-alt) 100%)`,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

export { PRESETS as FLIP_SPEED_PRESETS };
