import React from 'react'
const files = {
  click:  '/sfx/click.mp3',
  win:    '/sfx/win.mp3',
  wrong:  '/sfx/wrong.mp3',
  reward: '/sfx/reward.mp3',
}
export function useSfx() {
  const [enabled, setEnabled] = React.useState<boolean>(() => localStorage.getItem('sfx') !== '0')
  const play = (k: keyof typeof files) => {
    if (!enabled) return
    const a = new Audio(files[k])
    a.volume = .6
    a.play().catch(() => {})
  }
  const toggle = (v?: boolean) => {
    const nv = v ?? !enabled
    setEnabled(nv)
    localStorage.setItem('sfx', nv ? '1':'0')
  }
  return { enabled, play, toggle }
}

