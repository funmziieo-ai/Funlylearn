import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Loader2 } from 'lucide-react';
import { fetchAudioTTS } from '../services/apiClient';
import mamaTitiIconSrc from '../assets/images/mama_titi_official_1784860280943.jpg';

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
  const [isLoading, setIsLoading] = useState(false);
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
  }, [text]);

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
    setIsLoading(false);
    setActiveWordIndex(null);
    if (onSpeechStateChange) onSpeechStateChange(false);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    stoppedRef.current = false;
    setIsLoading(true);

    try {
      const ttsData = await fetchAudioTTS(cleanText, language);

      if (stoppedRef.current) return;

      if (ttsData.audioUrl) {
        const audio = new Audio(ttsData.audioUrl);
        audioRef.current = audio;

        const totalDurationMs = await new Promise<number>((resolve) => {
          audio.onloadedmetadata = () => {
            resolve(
              audio.duration && !isNaN(audio.duration) && audio.duration > 0
                ? audio.duration * 1000
                : words.length * 320
            );
          };
          setTimeout(() => resolve(words.length * 320), 800);
        });

        if (stoppedRef.current) return;

        setIsLoading(false);
        setIsPlaying(true);
        if (onSpeechStateChange) onSpeechStateChange(true);

        const wordIntervalMs = Math.max(
          180,
          totalDurationMs / words.length
        );

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
          }
        }, wordIntervalMs);

        audio.onended = () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          setActiveWordIndex(null);
          URL.revokeObjectURL(ttsData.audioUrl!);
          audioRef.current = null;
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        audio.onerror = () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          setIsLoading(false);
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        await audio.play();
      } else {
        // No real audio available — fail silently back to the normal
        // "Listen to Voice" state, rather than showing an alarming
        // error message. The button remains visible and tappable again
        // immediately; we just don't call attention to the failure.
        setIsLoading(false);
        setIsPlaying(false);
        if (onSpeechStateChange) onSpeechStateChange(false);
      }
    } catch {
      if (!stoppedRef.current) {
        setIsLoading(false);
        setIsPlaying(false);
        if (onSpeechStateChange) onSpeechStateChange(false);
      }
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
        {isLoading ? (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <style>{`
              @keyframes mama-orbit-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes mama-glow-pulse {
                0%, 100% { opacity: 0.35; transform: scale(1); }
                50% { opacity: 0.75; transform: scale(1.2); }
              }
              .mama-orbit-wrap { position: relative; width: 28px; height: 28px; flex-shrink: 0; }
              .mama-orbit-glow {
                position: absolute;
                inset: -3px;
                border-radius: 9999px;
                background: radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(251,191,36,0) 70%);
                animation: mama-glow-pulse 1.4s ease-in-out infinite;
              }
              .mama-orbit-photo {
                position: absolute;
                inset: 0;
                border-radius: 9999px;
                object-fit: cover;
                z-index: 2;
              }
              .mama-orbit-dots {
                position: absolute;
                inset: -5px;
                z-index: 3;
                animation: mama-orbit-spin 1.1s linear infinite;
              }
              .mama-orbit-dot {
                position: absolute;
                width: 4px;
                height: 4px;
                border-radius: 9999px;
                background: #064E3B;
              }
              .mama-orbit-dot:nth-child(1) { top: 0; left: 50%; margin-left: -2px; }
              .mama-orbit-dot:nth-child(2) { bottom: 6%; right: 6%; }
              .mama-orbit-dot:nth-child(3) { bottom: 6%; left: 6%; }
            `}</style>
            <div className="mama-orbit-wrap">
              <div className="mama-orbit-glow" />
              <img
                src={mamaTitiIconSrc}
                alt=""
                className="mama-orbit-photo"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="mama-orbit-dots">
                <span className="mama-orbit-dot" />
                <span className="mama-orbit-dot" />
                <span className="mama-orbit-dot" />
              </div>
            </div>
            <span>Loading Mama Titi's Voice...</span>
          </div>
        ) : (
          <button
            onClick={handlePlay}
            type="button"
            className={
              'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ' +
              (isPlaying
                ? 'bg-[#FF6B35] text-white hover:bg-[#E85523] ring-2 ring-amber-300'
                : 'bg-[#064E3B] text-white hover:bg-[#022C22]')
            }
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                <span>Mama Titi is Speaking...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Listen to Voice</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
