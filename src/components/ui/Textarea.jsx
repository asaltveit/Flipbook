import React, { useId } from 'react';

export default function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
  maxLength,
  action,
}) {
  const id = useId();
  const field = (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      maxLength={maxLength}
      className="ui-focus ui-field w-full px-4 py-3 rounded-[var(--radius-md)] resize-none text-sm"
    />
  );

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--crayon-red)' }} aria-hidden="true"> *</span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {action ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(180px,240px)] gap-6 items-end">
          {field}
          <div className="flex flex-col gap-3 w-full">{action}</div>
        </div>
      ) : (
        field
      )}

      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {value.length}{maxLength ? ` / ${maxLength}` : ''} characters
      </p>
    </div>
  );
}
