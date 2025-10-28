// src/lib/avatars.ts
export function randomGravatar(style: 'identicon' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'mp' = 'identicon', size = 256) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `https://www.gravatar.com/avatar/${hex}?d=${style}&s=${size}&r=g`;
}
