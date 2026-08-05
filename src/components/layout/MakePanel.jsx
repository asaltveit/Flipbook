import React from 'react';
import Panel from '@/components/ui/Panel';
import FileUpload from '@/components/ui/FileUpload';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export default function MakePanel({
  prompt,
  onPromptChange,
  onImageUpload,
  pageCount,
  onGenerate,
  canGenerate,
  isGenerating,
  generationProgress,
}) {
  return (
    <Panel
      title="Create Your Flipbook"
      id="panel-make"
      role="tabpanel"
      aria-labelledby="tab-make"
    >
      <div className="space-y-6">
        <FileUpload
          label="Upload Your Drawing"
          onChange={onImageUpload}
          pageCount={pageCount}
        />

        <Textarea
          label="Story Prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe what happens in your flipbook story..."
          required
          rows={4}
          action={(
            <div className="relative w-full">
              <div
                aria-live="polite"
                aria-atomic="true"
                className="absolute bottom-full left-0 right-0 mb-2 text-sm text-center min-h-[1.25rem]"
                style={{ color: 'var(--text-muted)' }}
              >
                {isGenerating && (generationProgress || 'Generating...')}
              </div>
              <Button
                variant="purple"
                size="lg"
                className="w-full"
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating}
                aria-busy={isGenerating}
              >
                <span aria-hidden="true">✨</span>
                <span>{isGenerating ? 'Creating Magic...' : 'Run Generation'}</span>
              </Button>
            </div>
          )}
        />
      </div>
    </Panel>
  );
}
