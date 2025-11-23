import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Upload, Download, ChevronLeft, ChevronRight, GripVertical, Trash2, Save } from 'lucide-react';
import useAnthropicFlipbookPrompts from '../hooks/story-creation';

const FlipBookViewer = () => {
  // Auth state - TODO: Replace with actual auth provider (Supabase Auth, etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

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
  const playIntervalRef = useRef(null);
  const canvasRef = useRef(null);

  const { loading, error, data, generatePrompts, abort } = useAnthropicFlipbookPrompts({
    apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
    endpoint: "https://api.anthropic.com/v1/responses",
    model: "claude-2.1"
  });

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
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

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      // TODO: Replace with actual auth check
      // const { data: { user } } = await supabase.auth.getUser();
      // setIsLoggedIn(!!user);
      // setUser(user);
      
      console.log('🔐 Checking auth status...');
      // Simulating not logged in by default
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
    }
  };

  // Initialize local flipbook (no database)
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

  // Simulated Supabase fetch function
  const fetchFlipbookFromSupabase = async () => {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('flipbooks')
      //   .select('*')
      //   .eq('id', flipbookId)
      //   .single();
      
      // For now, initialize with empty state
      console.log('📚 Fetching flipbook from Supabase...');
      
      // Simulated data structure that would come from Supabase
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
      images: [...prev.images, ...newImages].slice(0, 30), // Max 30 images
      updatedAt: new Date().toISOString()
    }));
  };

  // Delete an image from a specific page
  const deleteImage = (pageIndex) => {
    const newImages = flipbookData.images.filter((_, idx) => idx !== pageIndex);
    // Renumber remaining images
    const renumberedImages = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx
    }));
    
    setFlipbookData(prev => ({
      ...prev,
      images: renumberedImages,
      updatedAt: new Date().toISOString()
    }));
    
    // Adjust current page if needed
    if (currentPage >= renumberedImages.length && renumberedImages.length > 0) {
      setCurrentPage(renumberedImages.length - 1);
    } else if (renumberedImages.length === 0) {
      setCurrentPage(0);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!flipbookData.prompt.trim()) {
      alert('⚠️ Please enter a prompt to generate images');
      return;
    }
    
    if (flipbookData.images.length === 0) {
      alert('⚠️ Please upload at least one image to start generation');
      return;
    }
    //const storyIdea = "A small fox learns to fly with a paper kite in a windy park.";
    const previousImages = [
      { id: "prev_img_1", url: "https://example.com/fox_start.png", short_description: "fox facing left wearing red scarf" }
    ];
    const result = await generatePrompts({
      storyIdea: flipbookData.prompt,
      previousImages,
      maxFramesPerEvent: 3,
      falHtmlPath: "/mnt/data/Hack FLUX_ Beyond One - API and Prompting Guide.html"
    });
    console.log("result", result);
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

  // Update total pages
  const updateTotalPages = (newTotal) => {
    // This function is no longer needed as pages are based on images
    console.log('Total pages are now automatically managed based on images');
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
    
    // Update page numbers
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      pageNumber: idx
    }));
    
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
  }, [isPlaying, flipSpeed, totalPages]);

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

  // Get image for specific page
  const getImageForPage = (pageIndex) => {
    return flipbookData.images.find(img => img.pageNumber === pageIndex) || 
           flipbookData.images[pageIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              3D Flip-Book Viewer
            </h1>
            <p className="text-gray-400">Upload images and watch them flip like a real book</p>
            <p className="text-xs text-gray-500 mt-1">
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

        {/* Controls Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Upload Images</label>
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm">Choose Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">{flipbookData.images.length} page(s)</p>
              
              {/* Prompt Input */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Prompt <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={flipbookData.prompt}
                  onChange={(e) => updatePrompt(e.target.value)}
                  placeholder="Describe your flipbook animation... (required)"
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none text-sm"
                  rows="3"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {flipbookData.prompt.length} characters
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Flip Speed: {flipSpeed}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={flipSpeed}
                  onChange={(e) => setFlipSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flipSpeed - 100) / 1900) * 100}%, #374151 ${((flipSpeed - 100) / 1900) * 100}%, #374151 100%)`
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Actions</label>
                <div className="space-y-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg">✨</span>
                    <span className="text-sm font-semibold">
                      {isGenerating ? 'Generating...' : 'Run Generation'}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    <span className="text-sm">Export Page</span>
                  </button>
                </div>
              </div>
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
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-lg font-semibold">{currentPage + 1} / {totalPages}</span>
              </div>
            </>
          )}
        </div>

        {/* Playback Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => flipToPage(currentPage - 1)}
              disabled={currentPage === 0 || isFlipping}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RotateCcw size={20} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-colors ${
                isPlaying 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span className="font-semibold">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => flipToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || isFlipping || totalPages === 0}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Page Thumbnails with Drag & Drop */}
          {totalPages > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} />
                  Drag thumbnails to reorder pages
                </div>
                <div className="text-xs">
                  {flipbookData.images.length} page(s)
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const imageData = getImageForPage(idx);
                  return (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 group"
                    >
                      <div
                        draggable={imageData ? true : false}
                        onDragStart={(e) => imageData && handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={() => flipToPage(idx)}
                        className={`w-16 h-20 rounded-lg border-2 transition-all cursor-pointer ${
                          currentPage === idx 
                            ? 'border-blue-500 scale-110' 
                            : 'border-gray-600 hover:border-gray-500'
                        } ${isFlipping ? 'pointer-events-none' : ''} ${
                          draggedIndex === idx ? 'opacity-50' : ''
                        } ${imageData ? 'cursor-move' : 'cursor-pointer'}`}
                      >
                        {imageData ? (
                          <img src={imageData.imageUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center text-xs">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      {imageData && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(idx);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <style jsx>{`
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
