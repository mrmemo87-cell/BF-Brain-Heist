import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeistProgress({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
            className="w-[90vw] max-w-[420px] rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-white text-center"
          >
            <div className="text-lg font-semibold mb-2">Infiltrating…</div>
            <div className="text-sm text-white/70 mb-4">running exploits, dodging firewalls</div>
            <div className="mx-auto h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-teal-400"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
