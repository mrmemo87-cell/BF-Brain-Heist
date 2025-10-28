import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const GEMINI = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';

  return {
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    plugins: [react()],
    resolve: {
      alias: {
        // в¬‡пёЏ alias @ to /src
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(GEMINI),
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(GEMINI),
    },
  };
});

