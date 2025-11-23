// DeleteAllImages.js
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useUser } from './useUser';

export function DeleteAllImagesButton({ onDeleteComplete }) {
  const { user } = useUser();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL your images? This cannot be undone!')) {
      return;
    }

    setDeleting(true);

    try {
      // Get all user images first to delete from storage
      const { data: images, error: fetchError } = await supabase
        .from('images')
        .select('image_path')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Delete from storage
      if (images && images.length > 0) {
        const paths = images.map(img => img.image_path);
        const { error: storageError } = await supabase.storage
          .from('ai-images')
          .remove(paths);

        if (storageError) {
          console.warn('Storage deletion warning:', storageError);
        }
      }

      // Delete from database via RPC
      const { data: count, error: rpcError } = await supabase.rpc('delete_all_user_images', {
        p_user_id: user.id
      });

      if (rpcError) throw rpcError;

      alert(`Successfully deleted ${count} images`);
      
      if (onDeleteComplete) {
        onDeleteComplete();
      }
    } catch (error) {
      alert(`Delete all failed: ${error.message}`);
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <button 
      onClick={handleDeleteAll} 
      disabled={deleting}
      style={{ backgroundColor: '#d32f2f', color: 'white' }}
    >
      {deleting ? 'Deleting All...' : 'Delete All Images'}
    </button>
  );
}