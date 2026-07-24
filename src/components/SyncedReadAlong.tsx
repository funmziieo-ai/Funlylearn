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
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const words = text.split(/\s+/);

  // Pre-load Web Speech API voices as fallback
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
      stopSpeech();
    };
  }, [text]);

  const stopSpeech = () => {
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
      stopSpeech();
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      // Step 1: Call server API for YarnGPT Idera TTS
      const ttsData = await fetchAudioTTS(text, language);

      if (ttsData.audioBase64) {
        const audio = new Audio(ttsData.audioBase64);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => resolve();
          audio.onerror = () => reject(new Error('Audio playback error'));
          setTimeout(() => resolve(), 600);
        });

        setIsLoading(false);
        setIsPlaying(true);
        if (onSpeechStateChange) onSpeechStateChange(true);

        const totalDurationMs = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
          ? audio.duration * 1000
          : words.length * 280;

        const wordIntervalMs = Math.max(140, totalDurationMs / words.length);

        let currentIdx = 0;
        const interval = setInterval(() => {
          if (currentIdx < words.length) {
            setActiveWordIndex(currentIdx);
            currentIdx++;
          } else {
            clearInterval(interval);
          }
        }, wordIntervalMs);

        audio.onended = () => {
          clearInterval(interval);
          setIsPlaying(false);
          setActiveWordIndex(null);
          audioRef.current = null;
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        audio.onerror = () => {
          clearInterval(interval);
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
          if (onSpeechStateChange) onSpeechStateChange(false);
        };

        await audio.play();
        return;
      }
    } catch (_e) {
      // Fallback below
    }

    // Step 2: Fallback to Browser Speech Synthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        speechUtteranceRef.current = utterance;

        const availVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const preferredVoice = availVoices.find(
          v => v.lang.toLowerCase().includes('yo') ||
               v.lang.toLowerCase().includes('en-ng') ||
               v.name.toLowerCase().includes('nigeria')
        ) || availVoices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.9;
        utterance.pitch = 1.05;

        utterance.onstart = () => {
          setIsLoading(false);
          setIsPlaying(true);
          if (onSpeechStateChange) onSpeechStateChange(true);
        };

        utterance.onboundary = (event) => {
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

        // Word interval timer
        let currentIdx = 0;
        const intervalMs = Math.max(200, (text.length * 55) / words.length);
        const fallbackTimer = setInterval(() => {
          if (window.speechSynthesis.speaking && currentIdx < words.length) {
            setActiveWordIndex(currentIdx);
            currentIdx++;
          } else {
            clearInterval(fallbackTimer);
          }
        }, intervalMs);

        return;
      } catch (_err) {
        // Continue to error state
      }
    }

    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
    if (onSpeechStateChange) onSpeechStateChange(false);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Words display with active word highlight */}
      <div className="leading-relaxed text-slate-900 text-sm sm:text-base font-sans">
        {words.map((word, idx) => {
          const isActive = activeWordIndex === idx;
          return (
            <span
              key={idx}
              className={`transition-all duration-150 inline-block mr-1 my-0.5 ${
                isActive
                  ? 'bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded scale-105 ring-2 ring-amber-400'
                  : ''
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Audio narration Listen button & states */}
      <div className="pt-1 flex items-center space-x-2">
        {isLoading ? (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-jakarta font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Generating Idera Voice...</span>
          </div>
        ) : hasError ? (
          <button
            onClick={handlePlay}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-jakarta font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition-all shadow-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Couldn't load audio, try again</span>
            <RotateCcw className="w-3 h-3 ml-0.5" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            type="button"
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-jakarta font-bold transition-all shadow-xs ${
              isPlaying
                ? 'bg-[#FF6B35] text-white hover:bg-[#E85523] ring-2 ring-amber-300'
                : 'bg-[#064E3B] text-white hover:bg-[#022C22]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                <span>Mama Titi is Speaking...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Listen to Voice 🔊</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
