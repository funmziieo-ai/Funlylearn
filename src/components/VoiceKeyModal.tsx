import React, { useState } from 'react';
import { X, Mic, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { fetchAudioTTS } from '../services/apiClient';

interface VoiceKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceKeyModal: React.FC<VoiceKeyModalProps> = ({ isOpen, onClose }) => {
  const [testingAudio, setTestingAudio] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const sampleYorubaText = "Ẹ kaarọ̀! Mo jẹ́ Mama Titi. Ẹ kú àbọ̀sí FunlyLearn, ilé ẹ̀kọ́ tí ó fẹ́ràn àwọn ọmọ Nigeria!";

  const handleTestVoice = async () => {
    setTestingAudio(true);
    setMessage({ type: 'info', text: 'Synthesizing test audio using Idera Yoruba Voice...' });
    try {
      const res = await fetchAudioTTS(sampleYorubaText, 'yo');
      if (res.audioBase64) {
        const audio = new Audio(res.audioBase64);
        await audio.play();
        setMessage({ type: 'success', text: `Playing audio with voice: ${res.voice || 'Idera'} 🎉` });
      } else if (res.useClientSpeech) {
        setMessage({ type: 'error', text: 'Could not reach Idera voice — check the yarngpt-proxy function and API key in Supabase.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to generate audio sample: ' + (err.message || 'Network error') });
    } finally {
      setTestingAudio(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#022C22] border-2 border-amber-400/80 rounded-3xl shadow-2xl overflow-hidden font-sans text-white p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-emerald-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-2xl text-slate-950 shadow-md">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-300 flex items-center gap-1.5">
                Idera Voice 🎙
              </h2>
              <p className="text-xs text-emerald-200">Nigerian Yoruba Voice, powered by YarnGPT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#064E3B] p-4 rounded-2xl border border-emerald-700/60">
          <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
            Mama Titi uses <strong>Idera voice via YarnGPT</strong> to speak Yoruba naturally.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestVoice}
          disabled={testingAudio}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-jakarta font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {testingAudio ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Testing Voice...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Test Idera Voice 🔊</span>
            </>
          )}
        </button>

        {message && (
          <div className={`p-3.5 rounded-2xl border text-xs font-jakarta flex items-center space-x-2.5 ${
            message.type === 'success' ? 'bg-emerald-950 border-emerald-400 text-emerald-200' :
            message.type === 'error' ? 'bg-rose-950/80 border-rose-500 text-rose-200' :
            'bg-sky-950 border-sky-400 text-sky-200'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <p className="flex-1 leading-snug">{message.text}</p>
          </div>
        )}

        <div className="pt-2 border-t border-emerald-800/60 text-center">
          <p className="text-[11px] text-emerald-300/70">Voice Model: <strong>Idera</strong></p>
        </div>
      </div>
    </div>
  );
};
