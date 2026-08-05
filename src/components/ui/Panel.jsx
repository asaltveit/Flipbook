import React from 'react';

export default function Panel({ children, title, className = '', as: Tag = 'section', ...props }) {
  return (
    <Tag
      className={`rounded-[var(--radius-lg)] p-6 mb-6 ${className}`}
      style={{
        backgroundColor: 'var(--paper-surface)',
        border: 'var(--border-crayon-light)',
        boxShadow: 'var(--shadow-paper)',
      }}
      {...props}
    >
      {title && (
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
      )}
      {children}
    </Tag>
  );
}
