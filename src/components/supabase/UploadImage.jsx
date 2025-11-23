// UploadImage.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useUser } from './useUser';

export function UploadImage({ onUploadComplete }) {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadImageToSupabase = async (file) => {
    if (!user) throw new Error('Not authenticated');

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // Create path with date structure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const filePath = `${user.id}/${year}/${month}/${day}/${fileName}`;

    // Upload to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('ai-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) throw storageError;

    // Parse metadata
    let metadataObj = {};
    try {
      metadataObj = metadata ? JSON.parse(metadata) : {};
    } catch (e) {
      console.warn('Invalid metadata JSON, using empty object');
    }

    // Create database record via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('upload_image_record', {
      p_user_id: user.id,
      p_image_path: filePath,
      p_metadata: metadataObj
    });

    if (rpcError) throw rpcError;

    return { imageId: rpcData, filePath };
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadImageToSupabase(file);
      alert(`Upload successful! Image ID: ${result.imageId}`);
      setFile(null);
      setMetadata('');
      
      // Reset file input
      e.target.reset();
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div>Please log in to upload images</div>;
  }

  return (
    <div>
      <h2>Upload Image</h2>
      <form onSubmit={handleUpload}>
        <div>
          <label>Select Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        
        <div>
          <label>Metadata (JSON):</label>
          <textarea
            placeholder='{"prompt": "A sunset", "model": "dall-e-3"}'
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            disabled={uploading}
            rows={3}
            style={{ width: '100%' }}
          />
        </div>

        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </div>
  );
}