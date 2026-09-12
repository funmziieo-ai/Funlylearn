import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase, resetPasswordForEmail } from '../services/supabaseService';

// The real happy-smiley artwork, embedded directly as a data URI --
// deliberately not a separate file path this time. A previous version
// referenced /images/happy-smiley.png with an SVG fallback, but the
// deployed screen kept showing the fallback instead of the real image,
// meaning the file wasn't landing at the exact expected path. Embedding
// the actual bytes directly here removes that failure mode entirely:
// there is no file to misplace, so the real artwork always renders.
const HAPPY_SMILEY_DATA_URI = 'data:image/png;base64,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';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onContinueAsGuest: () => void;
}


export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

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

        {/* Card now uses a distinctly brighter green (#0E8256) than the
            page behind it (#064E3B) -- previously both were the same
            shade, so the card had zero visual separation from the
            screen once deployed, unlike the reference design. */}
        <div className="bg-[#0E8256] rounded-3xl overflow-hidden shadow-2xl">

          <div className="bg-[#FFC107] flex items-center justify-center py-8">
            <img
              src={HAPPY_SMILEY_DATA_URI}
              alt="Happy face"
              className="w-36 h-auto"
            />
          </div>

          <div className="px-5 pt-6 pb-2">
            {/* Fixed heading, matching the reference exactly -- this
                previously switched text between "Welcome back,
                Scholar!" and "Ready to Learn?" depending on mode,
                which the reference design never did. */}
            <h2 className="text-center text-white text-lg font-bold mb-5">
              Ready to Learn?
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-white/[0.14] rounded-xl px-3 py-3">
                <Mail className="w-4 h-4 text-white/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent flex-1 text-white placeholder-white/50 text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-white/[0.14] rounded-xl px-3 py-3">
                <Lock className="w-4 h-4 text-white/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-transparent flex-1 text-white placeholder-white/50 text-sm outline-none"
                />
                <button onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
                </button>
              </div>

              {infoMsg && (
                <p className="text-center text-emerald-100 text-xs px-2">{infoMsg}</p>
              )}
              {error && (
                <p className="text-center text-red-200 text-xs px-2">{error}</p>
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
                  className="w-full text-center text-white/60 text-xs underline disabled:opacity-60"
                >
                  {resetLoading ? 'Sending reset link...' : 'Forgot password? Reset here'}
                </button>
              )}

              {/* Single text-link mode switch, matching the reference
                  exactly -- replaces the earlier tab-toggle UI, which
                  wasn't in the approved design. */}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfoMsg(null); }}
                className="w-full text-center text-white/70 text-xs font-semibold pb-2"
              >
                {mode === 'signin' ? (
                  <>Don&apos;t have an account? <span className="text-[#FFC107] font-bold">Sign Up</span></>
                ) : (
                  <>Already have an account? <span className="text-[#FFC107] font-bold">Sign In</span></>
                )}
              </button>
            </div>
          </div>
        </div>

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
