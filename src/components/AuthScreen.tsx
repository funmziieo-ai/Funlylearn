import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase, resetPasswordForEmail } from '../services/supabaseService';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onContinueAsGuest: () => void;
}

// Fallback smiley -- an inline SVG reproducing the same real reference
// artwork (eyes + one continuous mouth stroke), used only if the real
// PNG at /images/happy-smiley.png is ever missing or fails to load.
// This guarantees the sign-in screen never shows a broken image icon,
// even if that asset hasn't been added to the repo yet.
const FallbackSmiley: React.FC = () => (
  <svg width="140" height="112" viewBox="0 0 392 315" aria-hidden="true">
    <ellipse cx="118" cy="52" rx="33" ry="52" fill="#0f172a" />
    <ellipse cx="279" cy="52" rx="33" ry="52" fill="#0f172a" />
    <circle cx="108" cy="34" r="9" fill="#fff" />
    <circle cx="269" cy="34" r="9" fill="#fff" />
    <path
      d="M76 106 Q68 118 82 124 Q140 170 196 124 Q212 118 204 106"
      stroke="#0f172a"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0, 90) scale(1, 0.9)"
    />
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [smileyFailed, setSmileyFailed] = useState(false);

  const handleEmailAuth = async () => {
    if (!supabase) {
      setError('Unable to connect right now. Please check your connection and try again.');
      return;
    }
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

  const handleForgotPassword = async () => {
    setError(null);
    setInfoMsg(null);

    if (!email) {
      setError('Please enter your email address above first, then tap "Forgot password?" again.');
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPasswordForEmail(email);
      if (result.success) {
        setInfoMsg(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError('Something went wrong sending the reset link. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#064E3B] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">

        <div className="bg-[#064E3B] rounded-3xl overflow-hidden shadow-2xl">

          {/* Yellow banner with the real happy-smiley artwork. Falls
              back to an inline SVG reproduction automatically if the
              PNG asset hasn't been added to the repo yet, so this
              screen never shows a broken-image icon. */}
          <div className="bg-[#FFC107] flex items-center justify-center py-8">
            {!smileyFailed ? (
              <img
                src="/images/happy-smiley.png"
                alt="Happy face"
                onError={() => setSmileyFailed(true)}
                className="w-36 h-auto"
              />
            ) : (
              <FallbackSmiley />
            )}
          </div>

          <div className="px-5 pt-6 pb-2">
            <h2 className="text-center text-white text-lg font-bold mb-4">
              {mode === 'signin' ? 'Welcome back, Scholar!' : 'Ready to Learn?'}
            </h2>

            <div className="space-y-3">
              <div className="flex bg-white/10 rounded-xl overflow-hidden mb-1">
                <button
                  onClick={() => { setMode('signin'); setError(null); setInfoMsg(null); }}
                  className={`flex-1 py-2.5 text-sm font-bold transition-all ${mode === 'signin' ? 'bg-[#FF6B35] text-white' : 'text-emerald-100'}`}
                >Sign In</button>
                <button
                  onClick={() => { setMode('signup'); setError(null); setInfoMsg(null); }}
                  className={`flex-1 py-2.5 text-sm font-bold transition-all ${mode === 'signup' ? 'bg-[#FF6B35] text-white' : 'text-emerald-100'}`}
                >Create Account</button>
              </div>

              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-3">
                <Mail className="w-4 h-4 text-emerald-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent flex-1 text-white placeholder-emerald-200/60 text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-3">
                <Lock className="w-4 h-4 text-emerald-200" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-transparent flex-1 text-white placeholder-emerald-200/60 text-sm outline-none"
                />
                <button onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4 text-emerald-200" /> : <Eye className="w-4 h-4 text-emerald-200" />}
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
                className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E85523] rounded-xl py-3 font-bold text-white disabled:opacity-60 transition-all"
              >
                {loading ? 'Please wait...' : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {mode === 'signin' && (
                <button
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="w-full text-center text-emerald-200/70 text-xs underline disabled:opacity-60 pb-4"
                >
                  {resetLoading ? 'Sending reset link...' : 'Forgot password? Reset here'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Guest path — kept, since 5 free daily messages without an
            account is a real, intentional part of the product. */}
        <button
          onClick={onContinueAsGuest}
          className="w-full text-center text-amber-300 text-sm font-bold underline mt-5"
        >
          Skip for now — Continue as Guest
        </button>
        <p className="text-center text-emerald-200/70 text-[11px] mt-1.5 px-4">
          5 free messages a day as a guest. Sign in anytime to save your stars.
        </p>
      </div>
    </div>
  );
};
