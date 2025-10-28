/**
 * Tiny confetti burst without external deps. Creates a handful of floating pieces
 * and removes them after the animation. Keep it lightweight for mobile.
 */
export function confettiBurst({ count = 24, colors = ['#22d3ee', '#e879f9', '#60a5fa', '#fbbf24'] } = {}) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.inset = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  document.body.appendChild(container)

  const w = window.innerWidth
  const h = window.innerHeight

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div')
    const size = 6 + Math.random() * 6
    const left = w / 2 + (Math.random() - 0.5) * (w * 0.2)
    const top = h / 2 + (Math.random() - 0.5) * (h * 0.1)
    const angle = Math.random() * 2 * Math.PI
    const distance = 100 + Math.random() * 160
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance

    piece.style.position = 'absolute'
    piece.style.left = `${left}px`
    piece.style.top = `${top}px`
    piece.style.width = `${size}px`
    piece.style.height = `${size}px`
    piece.style.background = colors[i % colors.length]
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px'
    piece.style.opacity = '0.95'
    piece.style.transform = `translate(0, 0) rotate(0deg)`
    piece.style.transition = `transform 700ms ease-out, opacity 800ms ease-out`

    container.appendChild(piece)

    // kick off next frame to transition
    requestAnimationFrame(() => {
      piece.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`
      piece.style.opacity = '0'
    })
  }

  // cleanup
  setTimeout(() => { container.remove() }, 1000)
}

