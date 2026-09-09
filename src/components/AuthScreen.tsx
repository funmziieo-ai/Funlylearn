import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserRound } from 'lucide-react';
import { supabase, resetPasswordForEmail } from '../services/supabaseService';

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

  // Previously this was just static text with no click handler at all —
  // tapping it could never have done anything. Now it actually calls the
  // real password reset function, using whatever email is already typed
  // into the field above (asking them to type it there first if empty).
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

        {/* Small header — enough to orient the screen without repeating
            the full mascot + "Welcome to FunlyLearn!" splash the child
            already saw on the previous page. */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0A5A45] border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
            <UserRound className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-white text-xl font-bold">
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </h1>
          <p className="text-emerald-200 text-xs mt-1">
            Save your stars and progress across devices
          </p>
        </div>

        {/* Sign-in form shows immediately — no longer hidden behind a
            "Parent? Sign in with email" toggle, per direct feedback
            that the extra tap felt unnecessary once the duplicate
            welcome splash was already removed. */}
        <div className="space-y-3 bg-[#0A5A45] rounded-2xl p-4">
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
            <button
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="w-full text-center text-emerald-300 text-xs underline disabled:opacity-60"
            >
              {resetLoading ? 'Sending reset link...' : 'Forgot password? Reset here'}
            </button>
          )}
        </div>

        {/* Guest path — kept, since 5 free daily messages without an
            account is a real, intentional part of the product, but now
            a lighter-weight secondary action rather than a competing
            prominent CTA sitting above the sign-in form. */}
        <button
          onClick={onContinueAsGuest}
          className="w-full text-center text-emerald-300 text-sm font-semibold underline mt-5"
        >
          Skip for now — Continue as Guest
        </button>
        <p className="text-center text-emerald-400/70 text-[11px] mt-1.5 px-4">
          5 free messages a day as a guest. Sign in anytime to save your stars.
        </p>
      </div>
    </div>
  );
};
