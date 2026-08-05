import React from 'react';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav aria-label="Main sections">
      <div className="ui-tab-bar" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className="ui-tab-btn"
            >
              {Icon && <Icon size={22} aria-hidden="true" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
