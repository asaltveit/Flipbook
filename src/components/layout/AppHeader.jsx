import React from 'react';
import { Settings, User, Sparkles, Eye } from 'lucide-react';
import Tabs from '@/components/ui/Tabs';
import Dropdown from '@/components/ui/Dropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AppHeader({
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
  isLoggedIn,
  isSaving,
  onLogin,
  onSave,
  onSpeedPreset,
  lastUpdated,
}) {
  const tabs = [
    { id: 'make', label: 'Make', icon: Sparkles },
    { id: 'watch', label: 'Watch', icon: Eye },
  ];

  const settingsItems = [
    {
      id: 'theme',
      label: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
      icon: Settings,
      onClick: onThemeToggle,
    },
    {
      id: 'speed-snail',
      label: 'Speed: Snail (1500ms)',
      icon: Settings,
      onClick: () => onSpeedPreset(1500),
    },
    {
      id: 'speed-normal',
      label: 'Speed: Normal (500ms)',
      icon: Settings,
      onClick: () => onSpeedPreset(500),
    },
    {
      id: 'speed-zoom',
      label: 'Speed: Zoom (150ms)',
      icon: Settings,
      onClick: () => onSpeedPreset(150),
    },
  ];

  const accountItems = isLoggedIn
    ? [
        {
          id: 'save',
          label: isSaving ? 'Saving...' : 'Save to Cloud',
          icon: User,
          onClick: onSave,
          disabled: isSaving,
        },
      ]
    : [
        {
          id: 'login',
          label: 'Login to Save',
          icon: User,
          onClick: onLogin,
        },
      ];

  return (
    <header className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--crayon-blue)',
            }}
          >
            Flipbook Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Upload your drawing and watch your story flip to life!
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {isLoggedIn
              ? `Last updated: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}`
              : 'Working locally — login to save your flipbook'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:pt-1">
          <Dropdown label="Settings" triggerIcon={Settings} items={settingsItems} />
          <Dropdown label="Account" triggerIcon={User} items={accountItems} />
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </header>
  );
}
