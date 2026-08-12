import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
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
  const [hasError, setHasError] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  const playWithBrowserSpeech = (fullText: string) => {
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      setIsLoading(false);
      setHasError(true);
      if (onSpeechStateChange) onSpeechStateChange(false);
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(fullText);
    speechUtteranceRef.current = utterance;

    const availVoices =
      voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    const preferredVoice =
      availVoices.find(v => v.name.toLowerCase().includes('nigeria')) ||
      availVoices.find(v => v.lang.toLowerCase().includes('en-gb')) ||
      availVoices.find(v => v.lang.toLowerCase().includes('en-us')) ||
      availVoices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.82;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      if (onSpeechStateChange) onSpeechStateChange(true);
    };

    utterance.onboundary = event => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        let accumulated = 0;
        for (let i = 0; i < words.length; i++) {
          accumulated += words[i].length + 1;
          if (accumulated >= charIndex) {
            setActiveWordIndex(i);
            break;
          }
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setActiveWordIndex(null);
      if (onSpeechStateChange) onSpeechStateChange(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setHasError(true);
      if (onSpeechStateChange) onSpeechStateChange(false);
    };

    window.speechSynthesis.speak(utterance);

    let currentIdx = 0;
    const intervalMs = Math.max(
      180,
      (cleanText.length * 50) / words.length
    );
    intervalRef.current = setInterval(() => {
      if (
        !stoppedRef.current &&
        window.speechSynthesis.speaking &&
        currentIdx < words.length
      ) {
        setActiveWordIndex(currentIdx);
        currentIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, intervalMs);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    stoppedRef.current = false;
    setHasError(false);
    setQuotaMessage(null);
    setIsLoading(true);

    try {
      const ttsData = await fetchAudioTTS(cleanText, language);

      if (stoppedRef.current) return;

      if (ttsData.audioBase64) {
        const audio = new Audio(ttsData.audioBase64);
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
          audioRef.current = null;
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        audio.onerror = () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        await audio.play();
      } else {
        if (ttsData.quotaMessage) {
          setQuotaMessage(ttsData.quotaMessage);
        }
        setIsLoading(false);
        setIsPlaying(true);
        if (onSpeechStateChange) onSpeechStateChange(true);
        playWithBrowserSpeech(cleanText);
      }
    } catch {
      if (!stoppedRef.current) {
        setIsLoading(false);
        setIsPlaying(true);
        if (onSpeechStateChange) onSpeechStateChange(true);
        playWithBrowserSpeech(cleanText);
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

      {quotaMessage && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {quotaMessage}
        </div>
      )}

      <div className="pt-1 flex items-center space-x-2">
        {isLoading ? (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <style>{`
              @keyframes mama-dance-sm {
                0%, 100% { transform: translateY(0) rotate(-8deg); }
                25% { transform: translateY(-3px) rotate(8deg); }
                50% { transform: translateY(0) rotate(-8deg); }
                75% { transform: translateY(-3px) rotate(8deg); }
              }
              .mama-dancing-sm { animation: mama-dance-sm 0.7s ease-in-out infinite; }
            `}</style>
            <img
              src={mamaTitiIconSrc}
              alt=""
              className="mama-dancing-sm w-4 h-4 rounded-full object-cover object-top shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Loading Mama Titi's Voice...</span>
          </div>
        ) : hasError ? (
          <button
            onClick={handlePlay}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition-all"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Try again</span>
            <RotateCcw className="w-3 h-3 ml-0.5" />
          </button>
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
