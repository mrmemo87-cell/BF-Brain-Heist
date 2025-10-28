import React, { useEffect } from 'react';
import { supa } from '@/SupabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      // Supabase v2 handles PKCE automatically if detectSessionInUrl=true,
      // but calling refresh once here makes it rock solid.
      await supa.auth.getSession();
      await supa.auth.refreshSession().catch(() => {});
      nav('/', { replace: true });
    })();
  }, [nav]);

  return <div className="p-6 text-center opacity-70">Finishing sign-inвЂ¦</div>;
}

