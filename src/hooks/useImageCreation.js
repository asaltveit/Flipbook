// useUser.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const result = await fal.subscribe("fal-ai/alpha-image-232/edit-image", {
        input: {
            prompt: ""
        },
        logs: true,
        onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
        }
        },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}