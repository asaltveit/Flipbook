import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAnthropicFlipbookPrompts from '@/hooks/story-creation';
import { createImagesForFrames } from '@/hooks/image-creation';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import AppShell from '@/components/layout/AppShell';
import AppHeader from '@/components/layout/AppHeader';
import MakePanel from '@/components/layout/MakePanel';
import WatchPanel from '@/components/layout/WatchPanel';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const FlipBookViewer = () => {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [isLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('make');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [flipbookData, setFlipbookData] = useState({
    id: null,
    name: 'Untitled Flipbook',
    prompt: '',
    images: [],
    createdAt: null,
    updatedAt: null,
  });

  const totalPages = flipbookData.images.length;

  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flipSpeed, setFlipSpeed] = useState(200);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const playIntervalRef = useRef(null);
  const canvasRef = useRef(null);

  const { generatePrompts } = useAnthropicFlipbookPrompts({
    apiKey: import.meta.env.VITE_ANTHROPIC_KEY,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchFlipbook = async () => {
      try {
        const mockData = {
          id: 'flipbook_123',
          name: 'My Flipbook',
          prompt: '',
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setFlipbookData(mockData);
      } catch (error) {
        console.error('Error fetching flipbook:', error);
      }
    };
    fetchFlipbook();
  }, [isLoggedIn]);

  const saveToSupabase = async () => {
    if (!isLoggedIn) {
      addToast('Please log in to save your flipbook to the cloud', 'info');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFlipbookData((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
      }));
      addToast('Flipbook saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving flipbook:', error);
      addToast('Error saving flipbook. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginClick = () => {
    addToast('Login is not yet available. Stay tuned!', 'info');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const imagePromises = files.map((file, idx) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: `img_${Date.now()}_${idx}`,
            pageNumber: flipbookData.images.length + idx,
            imageUrl: ev.target.result,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(imagePromises);
    setFlipbookData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 30),
      updatedAt: new Date().toISOString(),
    }));
    addToast(`Added ${newImages.length} page${newImages.length === 1 ? '' : 's'}!`, 'success');
  };

  const deleteImage = (pageIndex) => {
    const newImages = flipbookData.images.filter((_, idx) => idx !== pageIndex);
    const renumberedImages = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx,
    }));

    setFlipbookData((prev) => ({
      ...prev,
      images: renumberedImages,
      updatedAt: new Date().toISOString(),
    }));

    if (currentPage >= renumberedImages.length && renumberedImages.length > 0) {
      setCurrentPage(renumberedImages.length - 1);
    } else if (renumberedImages.length === 0) {
      setCurrentPage(0);
    }

    addToast('Page removed', 'info');
  };

  const handleGenerate = async () => {
    if (!flipbookData.prompt.trim()) {
      addToast('Please enter a story prompt first', 'error');
      return;
    }

    if (flipbookData.images.length === 0) {
      addToast('Please upload at least one drawing to start', 'error');
      return;
    }

    if (!import.meta.env.VITE_FAL_KEY) {
      addToast('Missing API key. Add VITE_FAL_KEY to your .env file', 'error');
      return;
    }

    const referenceImage = flipbookData.images[0];
    const previousImages = [{
      id: 'prev_img_1',
      url: referenceImage.imageUrl,
      short_description: referenceImage.fileName || 'reference drawing',
    }];

    setIsGenerating(true);
    setGenerationProgress('Generating story prompts...');

    try {
      const promptResult = await generatePrompts({
        storyIdea: flipbookData.prompt,
        previousImages,
        maxFramesPerEvent: 3,
      });

      if (promptResult?.error || !promptResult?.data) {
        const message = promptResult?.error?.message || 'Failed to generate story prompts';
        addToast(message, 'error');
        return;
      }

      const frames = promptResult.data.frames?.length
        ? promptResult.data.frames
        : (promptResult.data.prompts || []).map((prompt, index) => ({
            prompt,
            frame_index: index,
            caption: `Frame ${index + 1}`,
          }));

      if (frames.length === 0) {
        addToast('No image prompts were returned. Try a different story idea.', 'error');
        return;
      }

      const generatedImages = await createImagesForFrames({
        frames,
        referenceImageUrl: referenceImage.imageUrl,
        onFrameStart: (current, total) => {
          setGenerationProgress(`Generating image ${current} of ${total}...`);
        },
      });

      const newImages = generatedImages.map((img, idx) => ({
        id: `gen_${Date.now()}_${idx}`,
        pageNumber: flipbookData.images.length + idx,
        imageUrl: img.imageUrl,
        fileName: img.caption || `Generated frame ${idx + 1}`,
        caption: img.caption,
        generated: true,
        uploadedAt: new Date().toISOString(),
      }));

      setFlipbookData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 30),
        updatedAt: new Date().toISOString(),
      }));

      setGenerationProgress('');
      addToast(`Generated ${newImages.length} new page${newImages.length === 1 ? '' : 's'}!`, 'success');
      setActiveTab('watch');
    } catch (error) {
      console.error('Generation error:', error);
      addToast(`Generation failed: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const canGenerate = flipbookData.prompt.trim().length > 0 && flipbookData.images.length > 0;

  const updatePrompt = (newPrompt) => {
    setFlipbookData((prev) => ({
      ...prev,
      prompt: newPrompt,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...flipbookData.images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx,
    }));

    setFlipbookData((prev) => ({
      ...prev,
      images: reorderedImages,
      updatedAt: new Date().toISOString(),
    }));

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const flipToPage = useCallback((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection(pageIndex > currentPage ? 'forward' : 'backward');
      setTimeout(() => {
        setCurrentPage(pageIndex);
        setIsFlipping(false);
      }, flipSpeed / 2);
    }
  }, [totalPages, isFlipping, currentPage, flipSpeed]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentPage((prev) => {
          if (prev >= totalPages - 1) {
            setIsPlaying(false);
            return prev;
          }
          setIsFlipping(true);
          setFlipDirection('forward');
          setTimeout(() => setIsFlipping(false), flipSpeed / 2);
          return prev + 1;
        });
      }, flipSpeed);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, flipSpeed, totalPages]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPage(0);
    setIsFlipping(false);
    addToast('Back to the beginning!', 'info');
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const currentImage = flipbookData.images[currentPage];

    const exportBlob = () => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flipbook-page-${currentPage + 1}.png`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Page exported!', 'success');
      });
    };

    if (currentImage) {
      const img = new Image();
      img.src = currentImage.imageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        exportBlob();
      };
    } else {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paper-bg').trim() || '#fff8e7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888';
      ctx.font = '32px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${currentPage + 1}`, canvas.width / 2, canvas.height / 2);
      exportBlob();
    }
  };

  const getImageForPage = (pageIndex) => {
    return flipbookData.images.find((img) => img.pageNumber === pageIndex)
      || flipbookData.images[pageIndex];
  };

  return (
    <AppShell>
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeToggle={toggleTheme}
        isLoggedIn={isLoggedIn}
        isSaving={isSaving}
        onLogin={handleLoginClick}
        onSave={saveToSupabase}
        onSpeedPreset={setFlipSpeed}
        lastUpdated={flipbookData.updatedAt}
      />

      <main>
        {activeTab === 'make' && (
          <MakePanel
            prompt={flipbookData.prompt}
            onPromptChange={updatePrompt}
            onImageUpload={handleImageUpload}
            pageCount={flipbookData.images.length}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
          />
        )}

        {activeTab === 'watch' && (
          <WatchPanel
            totalPages={totalPages}
            currentPage={currentPage}
            isFlipping={isFlipping}
            flipDirection={flipDirection}
            flipSpeed={flipSpeed}
            isPlaying={isPlaying}
            flipbookData={flipbookData}
            draggedIndex={draggedIndex}
            getImageForPage={getImageForPage}
            flipToPage={flipToPage}
            onReset={handleReset}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onExport={handleExport}
            onFlipSpeedChange={setFlipSpeed}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDeleteRequest={setDeleteTarget}
            canvasRef={canvasRef}
          />
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this page?"
        message="Are you sure you want to remove this page from your flipbook?"
        confirmLabel="Remove"
        cancelLabel="Keep It"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget !== null) deleteImage(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
};

export default FlipBookViewer;
