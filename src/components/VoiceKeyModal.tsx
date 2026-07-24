import React, { useState, useEffect } from 'react';
import { X, Key, Mic, CheckCircle2, AlertCircle, Eye, EyeOff, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { getVoiceConfig, saveVoiceConfig, fetchAudioTTS, VoiceConfigResponse } from '../services/apiClient';

interface VoiceKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceKeyModal: React.FC<VoiceKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<VoiceConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const sampleYorubaText = "Ẹ kaarọ̀! Mo jẹ́ Mama Titi. Ẹ kú àbọ̀ sí FunlyLearn, ilé ẹ̀kọ́ tí ó fẹ́ràn àwọn ọmọ Nigeria!";

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setMessage(null);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoadingConfig(true);
    try {
      const cfg = await getVoiceConfig();
      setStatus(cfg);
    } catch (err) {
      console.error('Failed to load voice config', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid YarnGPT API Key.' });
      return;
    }

    setSavingKey(true);
    setMessage(null);

    try {
      const res = await saveVoiceConfig({ yarnApiKey: apiKeyInput.trim() });
      if (res.success) {
        setStatus(res.config);
        setMessage({ type: 'success', text: res.message || 'YarnGPT API key saved successfully! Idera voice is active.' });
        setApiKeyInput('');
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to save key.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestVoice = async () => {
    setTestingAudio(true);
    setMessage({ type: 'info', text: 'Synthesizing test audio using Idera Yoruba Voice...' });

    try {
      const res = await fetchAudioTTS(sampleYorubaText, 'yo');
      if (res.audioBase64) {
        const audio = new Audio(res.audioBase64);
        await audio.play();
        setMessage({
          type: 'success',
          text: `Playing audio with voice: ${res.voice || 'Idera (YarnGPT Yoruba)'} 🎉`
        });
      } else if (res.useClientSpeech) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(sampleYorubaText);
          utterance.lang = 'yo-NG';
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
        setMessage({
          type: 'info',
          text: 'Playing using browser speech synthesis fallback. (Ensure YarnGPT API key is saved to use native Idera voice).'
        });
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
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-emerald-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-2xl text-slate-950 shadow-md">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-300 flex items-center gap-1.5">
                YarnGPT Voice Secret Key 🎙️
              </h2>
              <p className="text-xs text-emerald-200">
                Idera Nigerian Yoruba Voice API Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Key Status Banner */}
        <div className="bg-[#064E3B] p-4 rounded-2xl border border-emerald-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-jakarta font-semibold text-emerald-200 uppercase tracking-wider">
              Current Key Status:
            </span>
            {loadingConfig ? (
              <span className="text-xs text-amber-300 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
              </span>
            ) : status?.yarnGptConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/80 text-emerald-300 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Active ({status.yarnGptKeyMasked})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/80 text-amber-300 text-xs font-bold shadow-xs">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Not Configured
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
            Mama Titi uses <strong>Idera voice via YarnGPT</strong> (<code className="bg-emerald-950 px-1.5 py-0.5 rounded text-amber-300">https://yarngpt.ai/api/v1/tts</code>) to speak Yoruba naturally.
          </p>
        </div>

        {/* Secret Key Input Form */}
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-jakarta font-bold text-amber-300 uppercase tracking-wide">
              Paste YarnGPT API Key (Secret Space)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your YarnGPT API key here..."
                className="w-full pl-10 pr-12 py-3 bg-[#064E3B] border-2 border-emerald-600 focus:border-amber-400 rounded-2xl text-white placeholder-emerald-300/50 text-sm outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-300 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/80">
              Keys are stored securely in backend server memory or set via <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">YARNGPT_API_KEY</code> environment variable.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={savingKey || !apiKeyInput.trim()}
              className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-jakarta font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingKey ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Key...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Secret Key</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleTestVoice}
              disabled={testingAudio}
              className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-[#064E3B] hover:bg-[#08634B] border border-amber-400/50 text-amber-300 font-jakarta font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
          </div>
        </form>

        {/* Notification Feedback Message */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-jakarta flex items-center space-x-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                : message.type === 'error'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-sky-950 border-sky-400 text-sky-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <p className="flex-1 leading-snug">{message.text}</p>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-emerald-800/60 text-center">
          <p className="text-[11px] text-emerald-300/70">
            Official YarnGPT Documentation: <code className="text-amber-300">https://yarngpt.ai</code> · Voice Model: <strong>Idera</strong>
          </p>
        </div>

      </div>
    </div>
  );
};
