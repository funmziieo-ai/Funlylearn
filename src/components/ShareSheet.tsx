import React, { useState } from 'react';
import { Emoji3D } from './Emoji3D';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

// Opens the phone's own share menu (WhatsApp, Facebook, Instagram,
// Telegram, TikTok, SMS, email...). Returns false when the phone or
// browser doesn't have one (for example inside the Android app), so the
// caller can show the FunlyLearn share card instead.
export async function openNativeShare(data: ShareData): Promise<boolean> {
  const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void> };
  if (typeof nav.share !== 'function') return false;
  try {
    await nav.share({ title: data.title, text: data.text, url: data.url });
    return true;
  } catch (err) {
    // The child closed the share menu: that's fine, nothing else to do.
    if (err instanceof Error && err.name === 'AbortError') return true;
    return false;
  }
}

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[3px]';

interface ShareSheetProps {
  data: ShareData | null;
  onClose: () => void;
}

// The FunlyLearn share card: popular apps plus "Copy link", which works
// for any other app.
export const ShareSheet: React.FC<ShareSheetProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const message = `${data.text} ${data.url}`;
  const enc = encodeURIComponent;
  const options = [
    { label: 'WhatsApp', emoji: '💬', color: 'bg-[#16A34A]', href: `https://api.whatsapp.com/send?text=${enc(message)}` },
    { label: 'Facebook', emoji: '📘', color: 'bg-[#1D4ED8]', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(data.url)}&quote=${enc(data.text)}` },
    { label: 'Telegram', emoji: '✈️', color: 'bg-[#0284C7]', href: `https://t.me/share/url?url=${enc(data.url)}&text=${enc(data.text)}` },
    { label: 'X', emoji: '🐦', color: 'bg-slate-800', href: `https://twitter.com/intent/tweet?text=${enc(data.text)}&url=${enc(data.url)}` },
    { label: 'SMS', emoji: '📱', color: 'bg-[#7E22CE]', href: `sms:?&body=${enc(message)}` },
    { label: 'Email', emoji: '📧', color: 'bg-[#FF6B35]', href: `mailto:?subject=${enc(data.title)}&body=${enc(message)}` }
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch (_e) {
      // Older phones: fall back to a hidden text box.
      const box = document.createElement('textarea');
      box.value = message;
      document.body.appendChild(box);
      box.select();
      try { document.execCommand('copy'); } catch (_err) {}
      box.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/70 p-3"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Share"
    >
      <div className="w-full max-w-sm rounded-[28px] bg-white text-slate-800 p-5 space-y-4 border-b-8 border-slate-300 font-['Nunito']">
        <div className="flex items-center justify-between gap-2">
          <p className={`${FUN} text-2xl font-bold text-[#064E3B] flex items-center gap-2`}>
            <Emoji3D emoji="📲" className="w-8 h-8" /> Share with friends
          </p>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 font-bold text-slate-600">✕</button>
        </div>
        <p className="text-sm font-semibold text-slate-600 rounded-2xl bg-slate-50 px-3 py-2">{data.text}</p>
        <div className="grid grid-cols-3 gap-2">
          {options.map(o => (
            <a
              key={o.label}
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 300)}
              className={`${PRESS} ${o.color} text-white rounded-2xl py-3 flex flex-col items-center gap-1 font-bold text-sm`}
            >
              <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
              {o.label}
            </a>
          ))}
        </div>
        <button
          onClick={copyLink}
          className={`${FUN} ${PRESS} w-full py-3.5 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-lg font-bold border-b-[5px] border-[#E0A800]`}
        >
          {copied ? '✓ Copied! Paste it in any app' : '🔗 Copy link (for any other app)'}
        </button>
      </div>
    </div>
  );
};
