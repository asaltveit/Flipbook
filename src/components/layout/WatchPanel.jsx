import React, { useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, Download, ChevronLeft, ChevronRight, GripVertical, Trash2,
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import Slider from '@/components/ui/Slider';

function CraftEmptyState() {
  return (
    <div className="placeholder-content">
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true" className="mx-auto mb-4">
        <rect x="10" y="20" width="50" height="40" rx="4" fill="var(--crayon-yellow)" stroke="var(--crayon-orange)" strokeWidth="2" />
        <rect x="20" y="12" width="50" height="40" rx="4" fill="var(--paper-surface)" stroke="var(--crayon-blue)" strokeWidth="2" />
        <circle cx="35" cy="28" r="4" fill="var(--crayon-red)" />
        <path d="M28 38 Q35 44 42 38" stroke="var(--crayon-blue)" strokeWidth="2" fill="none" />
      </svg>
      <p className="placeholder-title">No Pages Yet!</p>
      <p className="placeholder-subtitle">Go to Make and upload your drawing to start</p>
    </div>
  );
}

export default function WatchPanel({
  totalPages,
  currentPage,
  isFlipping,
  flipDirection,
  flipSpeed,
  isPlaying,
  flipbookData,
  draggedIndex,
  getImageForPage,
  flipToPage,
  onReset,
  onPlayToggle,
  onExport,
  onFlipSpeedChange,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDeleteRequest,
  canvasRef,
}) {
  const thumbnailStripRef = useRef(null);

  const handleThumbnailKeyDown = useCallback((e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipToPage(idx);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(idx + 1, totalPages - 1);
      thumbnailStripRef.current?.querySelector(`[data-thumb-index="${next}"]`)?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(idx - 1, 0);
      thumbnailStripRef.current?.querySelector(`[data-thumb-index="${prev}"]`)?.focus();
    }
  }, [flipToPage, totalPages]);

  return (
    <Panel
      title="Watch Your Flipbook"
      id="panel-watch"
      role="tabpanel"
      aria-labelledby="tab-watch"
    >
      <div className="relative mb-6">
        {totalPages === 0 ? (
          <div className="perspective-container">
            <div className="book-scene">
              <div className="page-face front">
                <div className="page-content">
                  <div className="page-placeholder">
                    <CraftEmptyState />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="perspective-container">
              <div className="book-scene">
                <div className="page-stack">
                  {Array.from({ length: Math.min(5, totalPages - currentPage - 1) }).map((_, idx) => (
                    <div
                      key={`stack-${idx}`}
                      className="stacked-page"
                      style={{
                        transform: `translateZ(${-5 - idx * 2}px) translateX(${idx * 2}px)`,
                        opacity: 1 - idx * 0.15,
                      }}
                    >
                      <div className="page-edge" />
                    </div>
                  ))}
                </div>

                <div className={`flip-container ${isFlipping ? 'flipping' : ''} ${flipDirection}`}>
                  <div
                    className="flipper"
                    style={{
                      animationDuration: `${flipSpeed}ms`,
                      '--flip-speed': `${flipSpeed}ms`,
                    }}
                  >
                    <div className="page-face front">
                      <div className="page-content">
                        {getImageForPage(currentPage) ? (
                          <img
                            src={getImageForPage(currentPage).imageUrl}
                            alt={`Page ${currentPage + 1}`}
                            className="page-image"
                          />
                        ) : (
                          <div className="page-placeholder">
                            <div className="placeholder-content">
                              <p className="placeholder-title">Page {currentPage + 1}</p>
                              <p className="placeholder-subtitle">No image yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="page-spine" />
                    </div>

                    <div className="page-face back">
                      <div className="page-content">
                        {flipDirection === 'forward' && currentPage < totalPages - 1 && getImageForPage(currentPage + 1) ? (
                          <img
                            src={getImageForPage(currentPage + 1).imageUrl}
                            alt={`Page ${currentPage + 2}`}
                            className="page-image"
                          />
                        ) : flipDirection === 'backward' && currentPage > 0 && getImageForPage(currentPage - 1) ? (
                          <img
                            src={getImageForPage(currentPage - 1).imageUrl}
                            alt={`Page ${currentPage}`}
                            className="page-image"
                          />
                        ) : (
                          <div className="page-placeholder">
                            <div className="placeholder-content">
                              <p className="placeholder-title">
                                Page {flipDirection === 'forward' ? currentPage + 2 : currentPage}
                              </p>
                              <p className="placeholder-subtitle">No image yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="page-spine" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-counter-badge" aria-live="polite">
              {currentPage + 1} / {totalPages}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <Button
          variant="secondary"
          iconOnly
          onClick={() => flipToPage(currentPage - 1)}
          disabled={currentPage === 0 || isFlipping}
          aria-label="Previous page"
        >
          <ChevronLeft size={24} />
        </Button>

        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={20} aria-hidden="true" />
          <span className="hidden sm:inline">Reset</span>
        </Button>

        <Button
          variant={isPlaying ? 'danger' : 'primary'}
          size="lg"
          onClick={onPlayToggle}
          aria-label={isPlaying ? 'Pause flipbook' : 'Play flipbook'}
        >
          {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>

        <Button
          variant="secondary"
          iconOnly
          onClick={() => flipToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1 || isFlipping || totalPages === 0}
          aria-label="Next page"
        >
          <ChevronRight size={24} />
        </Button>

        <Button variant="success" onClick={onExport}>
          <Download size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Export Page</span>
        </Button>
      </div>

      <div className="max-w-md mx-auto mb-6">
        <Slider
          label="Flip Speed"
          value={flipSpeed}
          onChange={onFlipSpeedChange}
        />
      </div>

      {totalPages > 0 && (
        <div>
          <div
            className="text-sm mb-2 flex items-center justify-between"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-2">
              <GripVertical size={16} aria-hidden="true" />
              Drag thumbnails to reorder — use arrow keys to navigate
            </div>
            <div className="text-xs">
              {flipbookData.images.length} page{flipbookData.images.length === 1 ? '' : 's'}
            </div>
          </div>
          <div
            ref={thumbnailStripRef}
            className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 ui-scrollbar"
            role="listbox"
            aria-label="Page thumbnails"
          >
            {Array.from({ length: totalPages }).map((_, idx) => {
              const imageData = getImageForPage(idx);
              const isSelected = currentPage === idx;
              return (
                <div key={idx} className="relative flex-shrink-0 group" role="presentation">
                  <div
                    data-thumb-index={idx}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    draggable={!!imageData}
                    onDragStart={(e) => imageData && onDragStart(e, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    onClick={() => flipToPage(idx)}
                    onKeyDown={(e) => handleThumbnailKeyDown(e, idx)}
                    className={`ui-thumb-btn ${
                      isFlipping ? 'pointer-events-none' : ''
                    } ${draggedIndex === idx ? 'opacity-50' : ''}`}
                  >
                    {imageData ? (
                      <img
                        src={imageData.imageUrl}
                        alt={`Thumbnail page ${idx + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-sm font-semibold"
                        style={{
                          backgroundColor: 'var(--paper-surface-alt)',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  {imageData && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest(idx);
                      }}
                      className="ui-thumb-delete opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label={`Delete page ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
    </Panel>
  );
}
