import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { MamaTitiAvatar } from './MamaTitiAvatar';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    if (!supabase) return;
    setError(null);
    setInfoMsg(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuthSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;

        if (data.user && !data.session) {
          // Email confirmation required — no session yet
          setInfoMsg('Check your email to confirm your account before signing in.');
        } else if (data.user) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#064E3B] flex flex-col items-center px-5 pt-10 pb-8">
      {/* Mascot + welcome */}
      <MamaTitiAvatar size="xl" showOnlineStatus={false} className="mb-3" />
      <h1 className="text-white text-2xl font-bold text-center">Welcome to FunlyLearn!</h1>
      <p className="text-emerald-200 text-sm text-center mt-1 mb-8">
        Learn, play, and grow with Mama Titi
      </p>

      {/* Primary action */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onContinueAsGuest}
          className="w-full flex items-center justify-center gap-2 bg-[#FFC107] rounded-2xl py-4 shadow-md active:scale-[0.98] transition-transform"
        >
          <span className="font-bold text-emerald-900">Start Learning Now</span>
        </button>

        <p className="text-center text-emerald-200 text-xs px-4">
          5 free messages a day. Sign up anytime to save your stars.
        </p>

        {error && (
          <p className="text-center text-red-300 text-xs px-4">{error}</p>
        )}
      </div>

      {/* Collapsed email form */}
      <div className="w-full max-w-sm mt-6">
        <button
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="w-full text-center text-emerald-300 text-sm font-semibold underline"
        >
          {showEmailForm ? 'Hide email sign in' : 'Parent? Sign in with email'}
        </button>

        {showEmailForm && (
          <div className="mt-4 space-y-3 bg-[#0A5A45] rounded-2xl p-4">
            <div className="flex bg-[#022C22] rounded-xl overflow-hidden mb-2">
              <button
                onClick={() => { setMode('signin'); setError(null); setInfoMsg(null); }}
                className={`flex-1 py-2 text-sm font-bold ${mode === 'signin' ? 'bg-[#FFC107] text-emerald-900' : 'text-emerald-200'}`}
              >Sign In</button>
              <button
                onClick={() => { setMode('signup'); setError(null); setInfoMsg(null); }}
                className={`flex-1 py-2 text-sm font-bold ${mode === 'signup' ? 'bg-[#FFC107] text-emerald-900' : 'text-emerald-200'}`}
              >Create Account</button>
            </div>

            <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
              <Mail className="w-4 h-4 text-emerald-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
              <Lock className="w-4 h-4 text-emerald-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none"
              />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4 text-emerald-300" /> : <Eye className="w-4 h-4 text-emerald-300" />}
              </button>
            </div>

            {infoMsg && (
              <p className="text-center text-emerald-200 text-xs px-2">{infoMsg}</p>
            )}
            {error && (
              <p className="text-center text-red-300 text-xs px-2">{error}</p>
            )}

            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] rounded-xl py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'signin' && (
              <p className="text-center text-emerald-300 text-xs underline">Forgot password? Reset here</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
