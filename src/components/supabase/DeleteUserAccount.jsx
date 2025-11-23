// DeleteAccount.js (Frontend Component)
/*import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useUser } from './useUser';

export function DeleteAccountButton() {
  const { user } = useUser();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This will delete ALL your data and cannot be undone!')) {
      return;
    }

    if (!window.confirm('This is your FINAL warning. Type "DELETE" in the next prompt to confirm.')) {
      return;
    }

    const confirmation = window.prompt('Type DELETE to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      alert('Account deletion cancelled');
      return;
    }

    setDeleting(true);

    try {
      // Step 1: Clean up images and profile data*/