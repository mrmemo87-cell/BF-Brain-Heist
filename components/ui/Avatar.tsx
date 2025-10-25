import React from 'react'

export default function Avatar({
  src, name, size = 28, ring = false
}: { src?: string | null; name?: string; size?: number; ring?: boolean }) {
  const fallback = (name?.[0] ?? '?').toUpperCase()
  const cls = ring
    ? 'avatar-ring grid place-items-center'
    : 'rounded-full grid place-items-center border border-white/10'
  const style = ring ? {} : { width: size, height: size }
  return src ? (
    <img
      src={src}
      alt={name ?? 'avatar'}
      style={{ width: size, height: size, borderRadius: 9999 }}
      className="object-cover"
    />
  ) : (
    <div className={cls} style={style}>
      <div
        className="rounded-full grid place-items-center text-sm"
        style={{
          width: size - 8, height: size - 8,
          background: 'linear-gradient(135deg,#1de5ff33,#ff35e533)'
        }}
      >
        <span className="font-heading">{fallback}</span>
      </div>
    </div>
  )
}
