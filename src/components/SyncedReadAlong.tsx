import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause } from 'lucide-react';
import { fetchAudioTTS } from '../services/apiClient';

interface SyncedReadAlongProps {
  text: string;
  language?: string;
  autoPlay?: boolean;
  onSpeechStateChange?: (isSpeaking: boolean) => void;
  className?: string;
}

export const SyncedReadAlong: React.FC<SyncedReadAlongProps> = ({
  text,
  language = 'en',
  autoPlay = false,
  onSpeechStateChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRealAudioPlaying, setIsRealAudioPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const normalizeText = (raw: string): string => {
    return raw
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([.,!?:;])([A-Za-z])/g, '$1 $2')
      .replace(/([A-Za-z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([A-Za-z])/g, '$1 $2')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const cleanText = normalizeText(text);
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);

  useEffect(() => {
    if (autoPlay) {
      handlePlay();
    }
    return () => {
      stopAll();
    };
  }, [text, autoPlay]);

  const stopAll = () => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsRealAudioPlaying(false);
    setActiveWordIndex(null);
    if (onSpeechStateChange) onSpeechStateChange(false);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    stoppedRef.current = false;
    setIsPlaying(true);
    if (onSpeechStateChange) onSpeechStateChange(true);

    // Start the reading pacer immediately, using an estimated pace based
    // on word count — this runs regardless of whether real voice ever
    // loads, so a child always gets the visual reading-along benefit,
    // even when YarnGPT is down or slow. If real audio does load, it
    // plays alongside as a bonus rather than being required first.
    const estimatedIntervalMs = Math.max(180, (words.length * 320) / words.length);
    let currentIdx = 0;
    intervalRef.current = setInterval(() => {
      if (stoppedRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      if (currentIdx < words.length) {
        setActiveWordIndex(currentIdx);
        currentIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsPlaying(false);
        setActiveWordIndex(null);
        if (onSpeechStateChange) onSpeechStateChange(false);
      }
    }, estimatedIntervalMs);

    // Real voice fetch happens in parallel — a bonus layer, not a
    // requirement for the reading pacer above to keep running.
    try {
      const ttsData = await fetchAudioTTS(cleanText, language);

      if (stoppedRef.current) return;

      if (ttsData.audioUrl) {
        const audio = new Audio(ttsData.audioUrl);
        audioRef.current = audio;
        await audio.play();
        setIsRealAudioPlaying(true);

        audio.onended = () => {
          audioRef.current = null;
          setIsRealAudioPlaying(false);
          URL.revokeObjectURL(ttsData.audioUrl!);
          // Reading pacer keeps running on its own estimated timing —
          // not stopped here, since it may still have words left even
          // if audio finished slightly early or late.
        };

        audio.onerror = () => {
          setIsRealAudioPlaying(false);
          // Real audio failed mid-way — the reading pacer above is
          // completely unaffected and keeps running silently.
          audioRef.current = null;
        };
      }
      // No real audio available — the reading pacer above is already
      // running on its own and needs nothing further here.
    } catch {
      // Real voice fetch failed entirely — the reading pacer above is
      // completely unaffected and keeps running silently.
    }
  };

  return (
    <div className={'space-y-2.5 ' + className}>
      <div className="leading-relaxed text-slate-900 text-sm sm:text-base font-sans">
        {words.map((word, idx) => {
          const isActive = activeWordIndex === idx;
          return (
            <React.Fragment key={idx}>
              <span
                className={
                  'transition-all duration-100 inline ' +
                  (isActive
                    ? 'bg-amber-200 text-amber-950 font-bold px-0.5 rounded ring-1 ring-amber-400'
                    : '')
                }
              >
                {word}
              </span>
              {idx < words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>

      <div className="pt-1 flex items-center space-x-2">
        <button
            onClick={handlePlay}
            type="button"
            disabled={isPlaying && !isRealAudioPlaying}
            className={
              'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ' +
              (isRealAudioPlaying
                ? 'bg-[#FF6B35] text-white hover:bg-[#E85523] ring-2 ring-amber-300'
                : isPlaying
                ? 'bg-slate-200 text-slate-500 cursor-default'
                : 'bg-[#064E3B] text-white hover:bg-[#022C22]')
            }
          >
            {isRealAudioPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                <span>Mama Titi is Speaking...</span>
              </>
            ) : isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Reading...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Listen to Voice</span>
              </>
            )}
          </button>
      </div>
    </div>
  );
};
