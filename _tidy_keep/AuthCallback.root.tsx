// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The actual code exchange is handled in App.tsx Shell effect.
    // This component just needs to redirect to the home page after login.
    // A small delay can give time for the session to be established.
    const timer = setTimeout(() => navigate('/'), 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white">
      <p className="text-2xl font-mono animate-pulse">Signing you in...</p>
    </div>
  );
}

