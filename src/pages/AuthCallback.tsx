import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa } from '@/SupabaseClient';

export default function AuthCallback() {
  const nav = useNavigate();

  React.useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code  = url.searchParams.get('code');
      const err   = url.searchParams.get('error') || url.searchParams.get('error_description');

      try {
        if (err) throw new Error(err);
        if (code) {
          await supa.auth.exchangeCodeForSession(code);
        }
      } catch (e) {
        console.error('AuthCallback failed:', e);
      } finally {
        nav('/', { replace: true });
      }
    })();
  }, []);

  return (
    <div className="w-full h-screen grid place-items-center text-white">
      Finishing sign-in…
    </div>
  );
}
