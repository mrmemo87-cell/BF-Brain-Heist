import React from 'react'

/**
 * AnimatedBackground renders a subtle, animated gradient and blobs behind the app.
 * It's fixed and non-interactive, optimized for mobile-first.
 */
export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(800px_600px_at_20%_20%,rgba(0,255,255,0.15),transparent),radial-gradient(700px_500px_at_80%_30%,rgba(255,0,200,0.12),transparent),radial-gradient(600px_400px_at_50%_90%,rgba(0,150,255,0.12),transparent)] animate-gradient-slow" />

      {/* Soft moving blobs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl animate-blob" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl animate-blob animation-delay-4000" />
    </div>
  )
}

