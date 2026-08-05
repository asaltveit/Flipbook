import React from 'react';

export default function AppShell({ children }) {
  return (
    <div className="craft-table-bg min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
