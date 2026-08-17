import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Upload, Download, ChevronLeft, ChevronRight, GripVertical, Trash2, Save } from 'lucide-react';
import useAnthropicFlipbookPrompts from '@/hooks/story-creation';
import { createImagesForFrames } from '@/hooks/image-creation';
import ConfirmDialog from './ui/ConfirmDialog';
import {
  getImageForPage as getImageForPageUtil,
  renumberImages,
  adjustCurrentPageAfterDelete,
  capImagesAt30,
  prefersReducedMotion,
} from '@/lib/flipbook-utils';

const FlipBookViewer = () => {
  // Auth state - TODO: Replace with actual auth provider (Supabase Auth, etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [_user, setUser] = useState(null);

  // Supabase-ready state structure
  const [flipbookData, setFlipbookData] = useState({
    id: null,
    name: 'Untitled Flipbook',
    prompt: '', // User's text prompt
    images: [], // Array of { id, pageNumber, imageUrl, uploadedAt }
    createdAt: null,
    updatedAt: null
  });

  // Computed: total pages based on number of images
  const totalPages = flipbookData.images.length;

  // UI state
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flipSpeed, setFlipSpeed] = useState(200); // Default to 200ms
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(() => prefersReducedMotion());
  const playIntervalRef = useRef(null);
  const canvasRef = useRef(null);

  const { generatePrompts } = useAnthropicFlipbookPrompts({
    apiKey: import.meta.env.VITE_ANTHROPIC_KEY,
  });

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking auth status...');
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
    }
  };

  const initializeLocalFlipbook = () => {
    console.log('📱 Initializing local flipbook (not logged in)');
    setFlipbookData({
      id: null,
      name: 'Local Flipbook',
      prompt: '',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const fetchFlipbookFromSupabase = async () => {
    try {
      console.log('📚 Fetching flipbook from Supabase...');
      const mockData = {
        id: 'flipbook_123',
        name: 'My Flipbook',
        prompt: '',
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setFlipbookData(mockData);
    } catch (error) {
      console.error('Error fetching flipbook:', error);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch flipbook data based on auth status
  useEffect(() => {
    if (isLoggedIn) {
      fetchFlipbookFromSupabase();
    } else {
      // Load from local state only
      initializeLocalFlipbook();
    }
  }, [isLoggedIn]);

  // Simulated Supabase save function (only for logged-in users)
  const saveToSupabase = async () => {
    if (!isLoggedIn) {
      alert('⚠️ Please log in to save your flipbook to the database');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with actual Supabase mutation
      // const { data, error } = await supabase
      //   .from('flipbooks')
      //   .upsert({
      //     id: flipbookData.id,
      //     name: flipbookData.name,
      //     images: flipbookData.images,
      //     updated_at: new Date().toISOString()
      //   });
      
      console.log('💾 Saving to Supabase:', flipbookData);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFlipbookData(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }));
      
      alert('✅ Flipbook saved successfully!');
    } catch (error) {
      console.error('Error saving flipbook:', error);
      alert('❌ Error saving flipbook');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle login redirect
  const handleLoginClick = () => {
    // TODO: Replace with actual auth flow
    // await supabase.auth.signInWithOAuth({ provider: 'google' });
    // Or redirect to login page
    alert('🔐 Login functionality not yet implemented. This would redirect to your auth page.');
    console.log('Redirecting to login...');
  };

  // Handle image uploads - convert to base64 and store in state
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    const imagePromises = files.map((file, idx) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: `img_${Date.now()}_${idx}`,
            pageNumber: flipbookData.images.length + idx,
            imageUrl: e.target.result, // base64 data URL
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          };
          resolve(imageData);
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(imagePromises);
    
    // Update flipbook state with new images
    setFlipbookData(prev => ({
      ...prev,
      images: capImagesAt30(prev.images, newImages),
      updatedAt: new Date().toISOString()
    }));
  };

  // Delete an image from a specific page
  const deleteImage = (pageIndex) => {
    const newImages = renumberImages(
      flipbookData.images.filter((_, idx) => idx !== pageIndex)
    );

    setFlipbookData(prev => ({
      ...prev,
      images: newImages,
      updatedAt: new Date().toISOString()
    }));

    setCurrentPage(adjustCurrentPageAfterDelete(currentPage, newImages.length));
    setDeleteTarget(null);
  };

  const requestDeleteImage = (pageIndex) => {
    setDeleteTarget(pageIndex);
  };

  const handleGenerate = async () => {
    if (!flipbookData.prompt.trim()) {
      alert('Please enter a prompt to generate images');
      return;
    }

    if (flipbookData.images.length === 0) {
      alert('Please upload at least one image to start generation');
      return;
    }

    if (!import.meta.env.VITE_FAL_KEY) {
      alert('Missing VITE_FAL_KEY. Add your Fal API key to .env');
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
        alert(`⚠️ ${message}`);
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
        alert('⚠️ No image prompts were returned. Try a different story idea.');
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

      setFlipbookData(prev => ({
        ...prev,
        images: capImagesAt30(prev.images, newImages),
        updatedAt: new Date().toISOString(),
      }));

      setGenerationProgress('');
      alert(`✅ Generated ${newImages.length} image${newImages.length === 1 ? '' : 's'}!`);
    } catch (error) {
      console.error('Generation error:', error);
      alert(`❌ Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // Check if generation is ready
  const canGenerate = flipbookData.prompt.trim().length > 0 && flipbookData.images.length > 0;

  // Update prompt
  const updatePrompt = (newPrompt) => {
    setFlipbookData(prev => ({
      ...prev,
      prompt: newPrompt,
      updatedAt: new Date().toISOString()
    }));
  };

  // Drag and drop reordering
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
    
    const reorderedImages = renumberImages(newImages);
    
    setFlipbookData(prev => ({
      ...prev,
      images: reorderedImages,
      updatedAt: new Date().toISOString()
    }));
    
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Flip to specific page
  const flipToPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages && !isFlipping) {
      if (reduceMotion) {
        setCurrentPage(pageIndex);
        return;
      }
      setIsFlipping(true);
      setFlipDirection(pageIndex > currentPage ? 'forward' : 'backward');
      setTimeout(() => {
        setCurrentPage(pageIndex);
        setIsFlipping(false);
      }, flipSpeed / 2);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (reduceMotion) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      return undefined;
    }

    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentPage(prev => {
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
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, flipSpeed, totalPages, reduceMotion]);

  // Reset to beginning
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPage(0);
    setIsFlipping(false);
  };

  // Export current page
  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    const currentImage = flipbookData.images[currentPage];
    
    if (currentImage) {
      const img = new Image();
      img.src = currentImage.imageUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `flipbook-page-${currentPage + 1}.png`;
          a.click();
        });
      };
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${currentPage + 1}`, canvas.width / 2, canvas.height / 2);
      
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flipbook-page-${currentPage + 1}.png`;
        a.click();
      });
    }
  };

  const getImageForPage = (pageIndex) =>
    getImageForPageUtil(flipbookData.images, pageIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              3D Flip-Book Viewer
            </h1>
            <p className="text-gray-300 text-base">Upload images and watch them flip like a real book</p>
            <p className="text-sm text-gray-300 mt-1">
              {isLoggedIn ? (
                <>Last updated: {flipbookData.updatedAt ? new Date(flipbookData.updatedAt).toLocaleString() : 'Never'}</>
              ) : (
                <>Working locally - Login to save your flipbook</>
              )}
            </p>
          </div>
          
          {/* Login/Save Button */}
          {!isLoggedIn ? (
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save size={20} />
              <span className="font-semibold">Login to Save</span>
            </button>
          ) : (
            <button
              onClick={saveToSupabase}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span className="font-semibold">{isSaving ? 'Saving...' : 'Save to DB'}</span>
            </button>
          )}
        </div>

        {/* Generation Controls */}
        <main id="main-content" tabIndex={-1}>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <h2 className="text-base font-semibold uppercase tracking-wide text-gray-200 mb-4">
            Generation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <span id="upload-images-label" className="a11y-label block mb-2">Upload Images</span>
                <label className="a11y-btn a11y-btn-primary flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={18} aria-hidden="true" />
                  <span>Choose Files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-labelledby="upload-images-label"
                  />
                </label>
                <p className="a11y-helper mt-1">{flipbookData.images.length} page(s)</p>
              </div>

              <div>
                <label htmlFor="story-prompt" className="a11y-label block mb-2">
                  Prompt <span className="text-red-400">(required)</span>
                </label>
                <textarea
                  id="story-prompt"
                  value={flipbookData.prompt}
                  onChange={(e) => updatePrompt(e.target.value)}
                  placeholder="Describe your flipbook animation... (required)"
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:shadow-[var(--a11y-focus-ring)] resize-none text-base"
                  rows="3"
                  required
                  aria-required="true"
                />
                <p className="a11y-helper mt-1">
                  {flipbookData.prompt.length} characters
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="a11y-btn w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={isGenerating}
              >
                <span className="text-lg" aria-hidden="true">✨</span>
                <span className="font-semibold">
                  {isGenerating
                    ? (generationProgress || 'Generating...')
                    : 'Run Generation'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Flip Book Display */}
        <div className="relative mb-4">
          {totalPages === 0 ? (
            <div className="perspective-container">
              <div className="book-scene">
                <div className="page-face front">
                  <div className="page-content">
                    <div className="page-placeholder">
                      <div className="placeholder-content">
                        <div className="text-6xl mb-4">📤</div>
                        <div className="text-3xl font-bold mb-2">No Images Yet</div>
                        <div className="text-gray-400">Upload images to create your flipbook</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="perspective-container">
                <div className="book-scene">
                  {/* Stack of pages behind */}
                  <div className="page-stack">
                    {Array.from({ length: Math.min(5, totalPages - currentPage - 1) }).map((_, idx) => (
                      <div 
                        key={`stack-${idx}`}
                        className="stacked-page"
                        style={{
                          transform: `translateZ(${-5 - idx * 2}px) translateX(${idx * 2}px)`,
                          opacity: 1 - (idx * 0.15)
                        }}
                      >
                        <div className="page-edge" />
                      </div>
                    ))}
                  </div>

                  {/* Flipping page */}
                  <div className={`flip-container ${isFlipping ? 'flipping' : ''} ${flipDirection}`}>
                    <div className="flipper" style={{ 
                      animationDuration: `${flipSpeed}ms`,
                      '--flip-speed': `${flipSpeed}ms`
                    }}>
                      {/* Front of flipping page (current page) */}
                      <div className="page-face front">
                        <div className="page-content">
                          {getImageForPage(currentPage) ? (
                            <img src={getImageForPage(currentPage).imageUrl} alt={`Page ${currentPage + 1}`} className="page-image" />
                          ) : (
                            <div className="page-placeholder">
                              <div className="placeholder-content">
                                <div className="text-6xl mb-4">📄</div>
                                <div className="text-3xl font-bold mb-2">Page {currentPage + 1}</div>
                                <div className="text-gray-400">No image uploaded</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="page-spine"></div>
                      </div>

                      {/* Back of flipping page (next/previous page) */}
                      <div className="page-face back">
                        <div className="page-content">
                          {flipDirection === 'forward' && currentPage < totalPages - 1 && getImageForPage(currentPage + 1) ? (
                            <img src={getImageForPage(currentPage + 1).imageUrl} alt={`Page ${currentPage + 2}`} className="page-image" />
                          ) : flipDirection === 'backward' && currentPage > 0 && getImageForPage(currentPage - 1) ? (
                            <img src={getImageForPage(currentPage - 1).imageUrl} alt={`Page ${currentPage}`} className="page-image" />
                          ) : (
                            <div className="page-placeholder">
                              <div className="placeholder-content">
                                <div className="text-6xl mb-4">📄</div>
                                <div className="text-3xl font-bold mb-2">
                                  Page {flipDirection === 'forward' ? currentPage + 2 : currentPage}
                                </div>
                                <div className="text-gray-400">No image uploaded</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="page-spine"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Counter */}
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg" aria-live="polite" aria-atomic="true">
                <span className="text-lg font-semibold">Page {currentPage + 1} of {totalPages}</span>
              </div>
            </>
          )}
        </div>

        {/* Viewing Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <h2 className="text-base font-semibold uppercase tracking-wide text-gray-200 mb-4">
            Viewing
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => flipToPage(currentPage - 1)}
              disabled={currentPage === 0 || isFlipping}
              className="a11y-icon-btn"
              aria-label="Previous page"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="a11y-btn a11y-btn-secondary flex items-center gap-2"
              aria-label="Reset to first page"
            >
              <RotateCcw size={20} aria-hidden="true" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={reduceMotion && !isPlaying}
              className={`a11y-btn flex items-center gap-2 ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'a11y-btn-primary'
              }`}
              aria-label={isPlaying ? 'Pause auto-play' : 'Start auto-play'}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              <span className="font-semibold">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={() => flipToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || isFlipping || totalPages === 0}
              className="a11y-icon-btn"
              aria-label="Next page"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="a11y-btn flex items-center gap-2 bg-green-700 hover:bg-green-800"
              aria-label="Export current page as PNG"
            >
              <Download size={18} aria-hidden="true" />
              <span>Export Page</span>
            </button>
          </div>

          <div className="max-w-md mx-auto mb-6">
            <label htmlFor="flip-speed" className="a11y-label block mb-2 text-center">
              Flip Speed
            </label>
            <input
              id="flip-speed"
              type="range"
              min="100"
              max="2000"
              step="50"
              value={flipSpeed}
              onChange={(e) => setFlipSpeed(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={100}
              aria-valuemax={2000}
              aria-valuenow={flipSpeed}
              aria-valuetext={`${flipSpeed} milliseconds per page`}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flipSpeed - 100) / 1900) * 100}%, #374151 ${((flipSpeed - 100) / 1900) * 100}%, #374151 100%)`
              }}
            />
          </div>

          {/* Page Thumbnails with Drag & Drop */}
          {totalPages > 0 && (
            <div>
              <div className="text-sm text-gray-200 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} aria-hidden="true" />
                  Drag thumbnails to reorder pages
                </div>
                <div className="text-sm">
                  {flipbookData.images.length} page(s)
                </div>
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-4 pt-2 px-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                role="list"
                aria-label="Page thumbnails"
              >
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const imageData = getImageForPage(idx);
                  return (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 group"
                      role="listitem"
                    >
                      <div
                        draggable={!!imageData}
                        onDragStart={(e) => imageData && handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={() => flipToPage(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            flipToPage(idx);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Go to page ${idx + 1}${currentPage === idx ? ', current page' : ''}`}
                        aria-current={currentPage === idx ? 'true' : undefined}
                        className={`w-16 h-20 rounded-lg border-2 transition-all cursor-pointer ${
                          currentPage === idx
                            ? 'border-blue-500 scale-110'
                            : 'border-gray-600 hover:border-gray-500'
                        } ${isFlipping ? 'pointer-events-none' : ''} ${
                          draggedIndex === idx ? 'opacity-50' : ''
                        } ${imageData ? 'cursor-move' : 'cursor-pointer'}`}
                      >
                        {imageData ? (
                          <img src={imageData.imageUrl} alt="" className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center text-sm">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      {imageData && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteImage(idx);
                          }}
                          className="absolute -top-2 -right-2 min-h-[var(--a11y-touch-min)] min-w-[var(--a11y-touch-min)] flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full"
                          aria-label={`Delete page ${idx + 1}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </main>

        <ConfirmDialog
          open={deleteTarget !== null}
          title="Remove this page?"
          message="This page will be removed from your flipbook. You can always upload it again later."
          confirmLabel="Remove page"
          cancelLabel="Keep page"
          onConfirm={() => deleteImage(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <style>{`
        .perspective-container {
          perspective: 2500px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 500px;
          padding: 20px;
        }

        .book-scene {
          position: relative;
          width: 100%;
          max-width: 500px;
          aspect-ratio: 3/4;
          transform-style: preserve-3d;
        }

        .page-stack {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .stacked-page {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #2a2a3e 0%, #1f1f2e 100%);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        }

        .page-edge {
          position: absolute;
          right: 0;
          top: 0;
          width: 8px;
          height: 100%;
          background: linear-gradient(to right, rgba(0,0,0,0.3), transparent);
          border-radius: 0 8px 8px 0;
        }

        .flip-container {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .flipper {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform-origin: left center;
          transition: transform var(--flip-speed, 500ms) ease-in-out;
        }

        .flipping.forward .flipper {
          animation: flipPageForward var(--flip-speed, 500ms) ease-in-out forwards;
        }

        .flipping.backward .flipper {
          animation: flipPageBackward var(--flip-speed, 500ms) ease-in-out forwards;
        }

        @keyframes flipPageForward {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }

        @keyframes flipPageBackward {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(180deg);
          }
        }

        .page-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .front {
          transform: rotateY(0deg);
          z-index: 2;
        }

        .back {
          transform: rotateY(180deg);
        }

        .page-content {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .page-spine {
          position: absolute;
          left: 0;
          top: 0;
          width: 12px;
          height: 100%;
          background: linear-gradient(to right, 
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.2) 50%,
            transparent 100%
          );
          pointer-events: none;
        }

        .page-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .page-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-content {
          text-align: center;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }

        .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background-color: #1f2937;
        }

        @media (max-width: 768px) {
          .perspective-container {
            padding: 15px;
            min-height: 400px;
          }
          
          .book-scene {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FlipBookViewer;
