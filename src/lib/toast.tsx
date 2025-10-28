import React from 'react'
import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'

type Kind = 'success' | 'info' | 'warn' | 'error'
type Toast = { id: string; kind: Kind; title: string; subtitle?: string; ttl: number }

const useToastStore = create<{
  toasts: Toast[]
  push: (t: Omit<Toast,'id'|'ttl'> & { ttl?: number }) => void
  remove: (id: string) => void
}>((set, get) => ({
  toasts: [],
  push: ({ kind, title, subtitle, ttl = 2800 }) => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, kind, title, subtitle, ttl }] }))
    setTimeout(() => get().remove(id), ttl)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (title: string, subtitle?: string) => useToastStore.getState().push({ kind:'success', title, subtitle }),
  info:    (title: string, subtitle?: string) => useToastStore.getState().push({ kind:'info',    title, subtitle }),
  warn:    (title: string, subtitle?: string) => useToastStore.getState().push({ kind:'warn',    title, subtitle }),
  error:   (title: string, subtitle?: string) => useToastStore.getState().push({ kind:'error',   title, subtitle }),
}

const kindStyle: Record<Kind, string> = {
  success: 'border-green-400/50',
  info:    'border-cyan-400/50',
  warn:    'border-amber-400/50',
  error:   'border-rose-400/50',
}

export function Toasts() {
  const toasts = useToastStore(s => s.toasts)
  const remove = useToastStore(s => s.remove)

  return (
    <div className="fixed z-[999] left-1/2 -translate-x-1/2 bottom-6 w-[92vw] max-w-md space-y-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ y: 20, opacity: 0, scale: .98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: .98 }}
            layout
            className={`pointer-events-auto card-glass border ${kindStyle[t.kind]} px-4 py-3 rounded-2xl shadow-lg`}
            onClick={() => remove(t.id)}
          >
            <div className="font-heading text-[15px] gradient-text">{t.title}</div>
            {t.subtitle && <div className="text-sm opacity-80">{t.subtitle}</div>}
            <div className="h-1 mt-2 rounded-full"
              style={{ boxShadow: '0 0 8px hsl(var(--accent))', background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

