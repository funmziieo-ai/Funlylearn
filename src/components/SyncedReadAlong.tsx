import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
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
  const [hasError, setHasError] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);

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

  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

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
    setCurrentSentenceIdx(0);
    if (onSpeechStateChange) onSpeechStateChange(false);
  };

  const getWordOffset = (sentenceIdx: number): number => {
    let offset = 0;
    for (let i = 0; i < sentenceIdx; i++) {
      const sentWords = sentences[i].split(/\s+/).filter(w => w.length > 0);
      offset += sentWords.length;
    }
    return offset;
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
    const intervalMs = Math.max(180, (cleanText.length * 50) / words.length);
    intervalRef.current = setInterval(() => {
      if (!stoppedRef.current && window.speechSynthesis.speaking && currentIdx < words.length) {
        setActiveWordIndex(currentIdx);
        currentIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, intervalMs);
  };

  const playSentencesWithIdera = async () => {
    stoppedRef.current = false;

    for (let i = 0; i < sentences.length; i++) {
      if (stoppedRef.current) break;

      setCurrentSentenceIdx(i);
      const wordOffset = getWordOffset(i);
      const sentWords = sentences[i].split(/\s+/).filter(w => w.length > 0);

      try {
        const ttsData = await fetchAudioTTS(sentences[i], language);

        if (stoppedRef.current) break;

        if (ttsData.audioBase64) {
          await new Promise<void>((resolve) => {
            const audio = new Audio(ttsData.audioBase64);
            audioRef.current = audio;

            audio.onloadedmetadata = () => {
              const totalDurationMs =
                audio.duration && !isNaN(audio.duration) && audio.duration > 0
                  ? audio.duration * 1000
                  : sentWords.length * 350;

              const wordIntervalMs = Math.max(
                200,
                totalDurationMs / sentWords.length
              );

              let wordIdx = 0;
              intervalRef.current = setInterval(() => {
                if (stoppedRef.current) {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  resolve();
                  return;
                }
                if (wordIdx < sentWords.length) {
                  setActiveWordIndex(wordOffset + wordIdx);
                  wordIdx++;
                } else {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                }
              }, wordIntervalMs);
            };

            audio.onended = () => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              audioRef.current = null;
              resolve();
            };

            audio.onerror = () => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              audioRef.current = null;
              resolve();
            };

            audio.play().catch(() => resolve());
          });
        } else {
          await new Promise<void>((resolve) => {
            const sentWordCount = sentWords.length;
            const msPerWord = 350;
            let wordIdx = 0;
            intervalRef.current = setInterval(() => {
              if (stoppedRef.current) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                resolve();
                return;
              }
              if (wordIdx < sentWordCount) {
                setActiveWordIndex(wordOffset + wordIdx);
                wordIdx++;
              } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                resolve();
              }
            }, msPerWord);
          });
        }
      } catch {
        if (stoppedRef.current) break;
        const sentWordCount = sentWords.length;
        let wordIdx = 0;
        await new Promise<void>((resolve) => {
          intervalRef.current = setInterval(() => {
            if (stoppedRef.current) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              resolve();
              return;
            }
            if (wordIdx < sentWordCount) {
              setActiveWordIndex(wordOffset + wordIdx);
              wordIdx++;
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
              resolve();
            }
          }, 300);
        });
      }

      if (i < sentences.length - 1 && !stoppedRef.current) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!stoppedRef.current) {
      setIsPlaying(false);
      setActiveWordIndex(null);
      if (onSpeechStateChange) onSpeechStateChange(false);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    stoppedRef.current = false;
    setHasError(false);
    setIsLoading(true);

    try {
      const firstTts = await fetchAudioTTS(sentences[0] || cleanText, language);

      if (stoppedRef.current) return;

      if (firstTts.audioBase64) {
        setIsLoading(false);
        setIsPlaying(true);
        if (onSpeechStateChange) onSpeechStateChange(true);
        await playSentencesWithIdera();
      } else {
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

      <div className="pt-1 flex items-center space-x-2">
        {isLoading ? (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Loading Idera Voice...</span>
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
