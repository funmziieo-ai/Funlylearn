import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause } from 'lucide-react';
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
      handlePlay(false);
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

  // `manual` is passed explicitly by the caller (true for a real
  // button tap, false for the autoplay effect) rather than read from
  // a ref the caller sets beforehand — that pattern was the actual
  // bug: the button's onClick used to set isManualRef.current = true
  // BEFORE calling this function, so the "was this silently playing?"
  // check below always saw true already and could never detect the
  // silent-autoplay case, falling straight through to stopAll() every
  // time. A tap would stop it, and the very next tap would start it
  // fresh — exactly the stop-then-restart behaviour being reported.
  const handlePlay = async (manual: boolean) => {
    if (isPlaying) {
      if (manual && !isManualRef.current) {
        // This message is already playing silently from autoplay — a
        // tap here means "show me what's happening", not "stop it".
        // Reveal the current status instead of killing the in-progress
        // playback and forcing a restart from scratch.
        isManualRef.current = true;
        if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
          setIsRealAudioPlaying(true);
        } else {
          setIsLoading(true);
        }
        return;
      }
      if (manual) {
        // Already in a visible, manually-started playback — a second
        // tap here is a genuine "stop" request.
        stopAll();
      }
      // A non-manual (autoplay) call landing while already playing
      // (shouldn't normally happen, but just in case) does nothing.
      return;
    }

    isManualRef.current = manual;

    // Silence any other message's audio that might currently be
    // playing (autoplay on another bubble, a leftover from a previous
    // tap, etc.) BEFORE starting this one — this is what guarantees
    // only one Mama Titi voice is ever audible at a time, app-wide.
    stopAnyOtherActiveAudio();

    const myToken = ++callTokenRef.current;
    stoppedRef.current = false;
    setIsPlaying(true);
    if (onSpeechStateChange) onSpeechStateChange(true);

    // FIX: previously an estimated-pace word highlighter started right
    // here, immediately, using word count to guess timing — completely
    // independent of whether real audio had loaded or was playing.
    // Since autoPlay fires this on every new message, that meant words
    // visibly highlighted with no voice behind them at all, and if a
    // child tapped "Listen to Voice" after that silent cycle finished,
    // a brand new call started highlighting fresh from word zero —
    // exactly the two problems reported. Highlighting now starts ONLY
    // once real audio is confirmed playing, driven from the audio's
    // own timeline below (see the 'loadedmetadata' handler) — no
    // fallback estimate-based highlighting at all. If real audio never
    // loads, no highlighting happens, which is the intended behaviour:
    // the visual should only ever track a voice that is actually
    // speaking.

    // Real voice fetch happens now — Loading/Speaking UI states only
    // ever surface once a tap has made this a "manual" playback —
    // checked LIVE via isManualRef.current at each point below (not
    // captured once here), specifically so that tapping mid-flight
    // (the reveal path above) can retroactively turn on the visible UI
    // for a call that started out silent.
    const isCurrentlyManual = () => isManualRef.current;

    // Only show the loading spinner if the fetch is still pending after
    // 300ms — a cache hit typically resolves well under that, so this
    // keeps cached playback feeling instant instead of flickering a
    // spinner that immediately disappears.
    if (isCurrentlyManual()) {
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

        // This is now the ONLY source of word highlighting. Once the
        // real audio's actual length is known, the highlighter is
        // driven directly from the audio's own playback position, so
        // the highlighted word is always genuinely in sync with Mama
        // Titi's voice — and only ever appears once this fires, i.e.
        // once real audio actually has something to highlight.
        audio.addEventListener('loadedmetadata', () => {
          if (stoppedRef.current || callTokenRef.current !== myToken) return;
          if (!audio.duration || !isFinite(audio.duration)) return;

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
        // started talking. Checked live so a tap that arrived mid-
        // flight (turning this from silent to manual) still gets the
        // visible "Speaking" state the moment it's true.
        if (isCurrentlyManual()) {
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
            if (isCurrentlyManual()) setIsRealAudioPlaying(false);
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
          if (callTokenRef.current === myToken) {
            if (isCurrentlyManual()) setIsRealAudioPlaying(false);
            // FIX: previously left isPlaying stuck true forever on a
            // real-audio failure, since nothing here reset it — after
            // one failed playback the "Listen to Voice" button would
            // silently stop responding to further taps (isPlaying
            // already true meant every next tap only hit the "reveal"
            // or "stop" branches above, never a fresh attempt). Now
            // resets fully so the button works again on the next tap.
            setIsPlaying(false);
            setActiveWordIndex(null);
            if (onSpeechStateChange) onSpeechStateChange(false);
          }
          audioRef.current = null;
        };
      } else {
        // No real audio available — per the fix above, there is no
        // fallback highlighting to fall back to. Reset fully so this
        // component (and its button) is ready for a fresh attempt
        // next time, instead of leaving isPlaying stuck true with
        // nothing actually happening.
        if (isCurrentlyManual()) setIsLoading(false);
        setIsPlaying(false);
        if (onSpeechStateChange) onSpeechStateChange(false);
      }
    } catch {
      // Real voice fetch failed entirely — same reset as above, so a
      // failed attempt doesn't leave the button stuck.
      if (loadingIndicatorTimeoutRef.current) {
        clearTimeout(loadingIndicatorTimeoutRef.current);
        loadingIndicatorTimeoutRef.current = null;
      }
      if (callTokenRef.current === myToken) {
        if (isCurrentlyManual()) setIsLoading(false);
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
        <button
            onClick={() => handlePlay(true)}
            type="button"
            className={
              'inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ' +
              (isRealAudioPlaying
                ? 'bg-[#FF6B35] text-white hover:bg-[#E85523] ring-2 ring-amber-300'
                : isLoading
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 text-slate-900 shadow-sm'
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
                <Volume2 className="w-3.5 h-3.5 text-[#064E3B]" />
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
