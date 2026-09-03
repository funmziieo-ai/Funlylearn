import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRealAudioPlaying, setIsRealAudioPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isManualRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  // Delays showing "Loading Voice..." — cached audio (the common case
  // for repeated text like the welcome message) now resolves in
  // milliseconds, and flashing a loading spinner for that is worse
  // than just not showing one. Only a call that's genuinely taking a
  // moment gets the loading indicator, avoiding a distracting flicker
  // on every fast/cached play.
  const loadingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const isYoruba = language === 'yo';

  useEffect(() => {
    if (autoPlay) {
      isManualRef.current = false;
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
    if (loadingIndicatorTimeoutRef.current) {
      clearTimeout(loadingIndicatorTimeoutRef.current);
      loadingIndicatorTimeoutRef.current = null;
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
    // requirement for the reading pacer above to keep running. The
    // Loading/Speaking UI states only ever surface for an explicit tap
    // — an auto-triggered play (arriving message, greeting) runs this
    // exact same logic underneath, but stays silent at the button
    // level, letting the word highlighting alone carry the moment.
    const showUiState = isManualRef.current;

    // Only show the loading spinner if the fetch is still pending after
    // 300ms — a cache hit typically resolves well under that, so this
    // keeps cached playback feeling instant instead of flickering a
    // spinner that immediately disappears.
    if (showUiState) {
      loadingIndicatorTimeoutRef.current = setTimeout(() => {
        if (!stoppedRef.current) setIsLoading(true);
      }, 300);
    }

    try {
      const ttsData = await fetchAudioTTS(cleanText, language);

      if (loadingIndicatorTimeoutRef.current) {
        clearTimeout(loadingIndicatorTimeoutRef.current);
        loadingIndicatorTimeoutRef.current = null;
      }

      if (stoppedRef.current) return;

      if (ttsData.audioUrl) {
        const audio = new Audio(ttsData.audioUrl);
        audioRef.current = audio;

        // Once the real audio's actual length is known, stop relying on
        // the word-count estimate above (which has no idea how long the
        // real speech actually runs) and instead drive the highlighter
        // directly from the audio's own playback position. This is what
        // keeps the highlighted word genuinely in sync with Mama Titi's
        // voice instead of racing ahead of it.
        audio.addEventListener('loadedmetadata', () => {
          if (stoppedRef.current || !audio.duration || !isFinite(audio.duration)) return;

          // The estimate-based interval was only ever a placeholder
          // until we knew the real duration — replace it now.
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const perWordMs = (audio.duration * 1000) / words.length;

          const syncToAudio = () => {
            if (stoppedRef.current || !audioRef.current) return;
            const idx = Math.min(
              words.length - 1,
              Math.floor((audio.currentTime * 1000) / perWordMs)
            );
            setActiveWordIndex(idx);
            if (!audio.paused && !audio.ended) {
              requestAnimationFrame(syncToAudio);
            }
          };
          requestAnimationFrame(syncToAudio);
        });

        await audio.play();
        if (showUiState) {
          setIsLoading(false);
          setIsRealAudioPlaying(true);
        }

        audio.onended = () => {
          audioRef.current = null;
          if (showUiState) setIsRealAudioPlaying(false);
          URL.revokeObjectURL(ttsData.audioUrl!);
          setActiveWordIndex(null);
          setIsPlaying(false);
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        audio.onerror = () => {
          if (showUiState) setIsRealAudioPlaying(false);
          // Real audio failed mid-way — the reading pacer above is
          // completely unaffected and keeps running silently.
          audioRef.current = null;
        };
      } else {
        // No real audio available — the reading pacer above is already
        // running on its own and needs nothing further here.
        if (showUiState) setIsLoading(false);
      }
    } catch {
      // Real voice fetch failed entirely — the reading pacer above is
      // completely unaffected and keeps running silently.
      if (loadingIndicatorTimeoutRef.current) {
        clearTimeout(loadingIndicatorTimeoutRef.current);
        loadingIndicatorTimeoutRef.current = null;
      }
      if (showUiState) setIsLoading(false);
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
            onClick={() => {
              isManualRef.current = true;
              handlePlay();
            }}
            type="button"
            className={
              'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ' +
              (isRealAudioPlaying
                ? 'bg-[#FF6B35] text-white hover:bg-[#E85523] ring-2 ring-amber-300'
                : isLoading
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-[#064E3B] text-white hover:bg-[#022C22]')
            }
          >
            {isRealAudioPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                <span>{isYoruba ? 'Mama Titi n sọrọ...' : 'Mama Titi is Speaking...'}</span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>
                  {isYoruba
                    ? 'Ohùn ń bọ̀ — tẹ̀síwájú ẹ̀kọ́, ọmọ mi olóòyè!'
                    : 'Voice is on its way — keep learning, Scholar!'}
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{isYoruba ? 'Gbọ́ Ohùn' : 'Listen to Voice'}</span>
              </>
            )}
          </button>
      </div>
    </div>
  );
};
