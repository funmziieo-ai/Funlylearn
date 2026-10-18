import React, { useState } from 'react';

// Real 3D icons: Microsoft Fluent Emoji 3D (MIT licence), served from
// the jsDelivr CDN. About 5 KB each, so they're light on data. Pinned
// to one version so icons never change unexpectedly.
const ICON_BASE = 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/';

// The icon files are named by the emoji's code points (e.g. 🏆 → 1f3c6).
// Some emojis are stored with the "FE0F" variation mark and some
// without, so we try both spellings before giving up.
function candidateUrls(emoji: string): string[] {
  const points = Array.from(emoji).map(ch => ch.codePointAt(0)!.toString(16));
  const exact = points.join('-');
  const withoutFe0f = points.filter(p => p !== 'fe0f').join('-');
  const withFe0f = points.length === 1 ? `${points[0]}-fe0f` : exact;
  return Array.from(new Set([exact, withoutFe0f, withFe0f])).map(code => `${ICON_BASE}${code}.webp`);
}

export function emoji3dUrl(emoji: string): string {
  return candidateUrls(emoji)[0];
}

interface Emoji3DProps {
  emoji: string;
  // Tailwind size classes, e.g. "w-10 h-10".
  className?: string;
  // Read out by screen readers. Leave empty when the icon is decoration.
  label?: string;
  style?: React.CSSProperties;
}

// Shows an emoji as a 3D icon. If the icon can't load (no internet, or
// an emoji the set doesn't have), the normal emoji shows instead, so
// nothing ever looks broken.
export const Emoji3D: React.FC<Emoji3DProps> = ({ emoji, className = 'w-8 h-8', label = '', style }) => {
  const urls = candidateUrls(emoji);
  const [attempt, setAttempt] = useState(0);

  if (attempt >= urls.length) {
    return (
      <span
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: '0.9em', ...style }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={urls[attempt]}
      alt={label}
      aria-hidden={label ? undefined : true}
      draggable={false}
      loading="lazy"
      onError={() => setAttempt(a => a + 1)}
      className={`inline-block object-contain select-none ${className}`}
      style={style}
    />
  );
};
