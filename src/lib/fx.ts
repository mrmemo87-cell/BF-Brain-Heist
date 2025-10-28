export async function confettiBurst() {
  try {
    // @ts-ignore - canvas-confetti from CDN
    const mod = await import('https://cdn.skypack.dev/canvas-confetti')
    mod.default({ particleCount: 90, spread: 70, origin: { y: 0.7 } })
  } catch {}
}

export function shake(el?: HTMLElement | null) {
  if (!el || !el.animate) return
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' },
    ], { duration: 300, easing: 'ease-in-out' }
  )
}

