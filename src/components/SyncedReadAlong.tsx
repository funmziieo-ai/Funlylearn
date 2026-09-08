import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Loader2 } from 'lucide-react';
import { fetchAudioTTS } from '../services/apiClient';

// Shared across EVERY SyncedReadAlong instance in the app (one per
// message bubble). Without this, an autoplaying message's audio and a
// manually-tapped "Listen to Voice" on another message (or even the
// same one, on a fast double-invocation) could both start real audio
// playback with nothing stopping the other — causing two voices to
// play over each other, and leaving one component's loading state
// orphaned since its audio silently lost the "race" for the speaker.
// This guarantees at most one real Mama Titi voice plays at any time,
// app-wide, no matter which message triggered it.
let globalActiveAudio: HTMLAudioElement | null = null;
let globalStopActive: (() => void) | null = null;

function stopAnyOtherActiveAudio() {
  if (globalStopActive) {
    globalStopActive();
  }
  globalActiveAudio = null;
  globalStopActive = null;
}

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
  // Incremented every time handlePlay actually starts a new attempt.
  // Any async work below only applies its result if callTokenRef still
  // matches the token it captured at the start — so a second call
  // (double-tap, or autoplay racing a manual tap) that starts while an
  // earlier one is still in flight can't have its state updates
  // clobbered by, or clobber, the other call.
  const callTokenRef = useRef(0);

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
    // Bump the token so any in-flight fetch/play promise for THIS
    // component that resolves after this point knows it's stale and
    // skips applying its result (see the token checks below).
    callTokenRef.current += 1;
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
    if (globalActiveAudio === audioRef.current) {
      globalActiveAudio = null;
      globalStopActive = null;
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

    // Silence any other message's audio that might currently be
    // playing (autoplay on another bubble, a leftover from a previous
    // tap, etc.) BEFORE starting this one — this is what guarantees
    // only one Mama Titi voice is ever audible at a time, app-wide.
    stopAnyOtherActiveAudio();

    const myToken = ++callTokenRef.current;
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

      // This call is no longer the current one for this component
      // (stopped, or superseded by a newer call) — drop its result
      // entirely rather than let a late response flip state back on.
      if (stoppedRef.current || callTokenRef.current !== myToken) return;

      if (ttsData.audioUrl) {
        const audio = new Audio(ttsData.audioUrl);
        audioRef.current = audio;

        // Register this as THE app-wide active audio right away (before
        // awaiting play) — if another message's "Listen to Voice" gets
        // tapped while this is still starting up, it can find and stop
        // this one via the same guard this call itself just used above.
        globalActiveAudio = audio;
        globalStopActive = () => {
          audio.pause();
          if (audioRef.current === audio) audioRef.current = null;
          setIsPlaying(false);
          setIsLoading(false);
          setIsRealAudioPlaying(false);
          setActiveWordIndex(null);
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        // Once the real audio's actual length is known, stop relying on
        // the word-count estimate above (which has no idea how long the
        // real speech actually runs) and instead drive the highlighter
        // directly from the audio's own playback position. This is what
        // keeps the highlighted word genuinely in sync with Mama Titi's
        // voice instead of racing ahead of it.
        audio.addEventListener('loadedmetadata', () => {
          if (stoppedRef.current || callTokenRef.current !== myToken) return;
          if (!audio.duration || !isFinite(audio.duration)) return;

          // The estimate-based interval was only ever a placeholder
          // until we knew the real duration — replace it now.
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const perWordMs = (audio.duration * 1000) / words.length;

          const syncToAudio = () => {
            if (stoppedRef.current || callTokenRef.current !== myToken || !audioRef.current) return;
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

        // Re-check after the await — a stop or a newer call could have
        // landed while play() itself was resolving.
        if (stoppedRef.current || callTokenRef.current !== myToken) {
          audio.pause();
          return;
        }

        // Real audio is genuinely audible now — flip out of the
        // "loading" state immediately rather than leaving the
        // reassurance message showing after Mama Titi has already
        // started talking.
        if (showUiState) {
          setIsLoading(false);
          setIsRealAudioPlaying(true);
        }

        audio.onended = () => {
          audioRef.current = null;
          if (globalActiveAudio === audio) {
            globalActiveAudio = null;
            globalStopActive = null;
          }
          if (callTokenRef.current === myToken) {
            if (showUiState) setIsRealAudioPlaying(false);
            setActiveWordIndex(null);
            setIsPlaying(false);
            if (onSpeechStateChange) onSpeechStateChange(false);
          }
          URL.revokeObjectURL(ttsData.audioUrl!);
        };

        audio.onerror = () => {
          if (globalActiveAudio === audio) {
            globalActiveAudio = null;
            globalStopActive = null;
          }
          if (callTokenRef.current === myToken && showUiState) {
            setIsRealAudioPlaying(false);
          }
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
      if (callTokenRef.current === myToken && showUiState) setIsLoading(false);
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
