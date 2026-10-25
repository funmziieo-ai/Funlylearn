import React, { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase, resetPasswordForEmail } from '../services/supabaseService';
import mamaTitiMain from '../assets/images/mama_titi_official_1784860280943.jpg';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onContinueAsGuest: () => void | Promise<void>;
  // Which form to open on: "signin" (Log in) or "signup" (Create account).
  initialMode?: 'signin' | 'signup';
  // Goes back to the landing page.
  onBack?: () => void;
}

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[4px]';
const ANKARA_DOTS: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(circle at 10px 10px, rgba(255,200,61,.35) 3px, transparent 3.5px)',
    'radial-gradient(circle at 24px 24px, rgba(255,107,53,.25) 3px, transparent 3.5px)'
  ].join(','),
  backgroundSize: '28px 28px'
};

function useFunFonts() {
  useEffect(() => {
    const id = 'funlylearn-fun-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest, initialMode = 'signin', onBack }) => {
  useFunFonts();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
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

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setInfoMsg(null);
  };

  const signUp = mode === 'signup';

  // "Try it as a guest" reacts on the first touch (even with the keyboard
  // open) and shows "Starting…" straight away while the app gets ready.
  const [guestStarting, setGuestStarting] = useState(false);
  const guestBusy = useRef(false); // stops a touch and a tap both starting it
  const startAsGuest = async () => {
    if (guestBusy.current) return;
    guestBusy.current = true;
    setGuestStarting(true);
    try {
      await onContinueAsGuest();
    } finally {
      guestBusy.current = false;
      setGuestStarting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFF8EC] text-slate-800 font-['Nunito']">
      <div className="absolute inset-0 opacity-60 pointer-events-none" style={ANKARA_DOTS} />

      <div className="relative max-w-md mx-auto px-5 py-5 space-y-5">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to the home page"
            className={`${PRESS} px-4 py-2.5 rounded-2xl bg-white text-[#064E3B] font-bold shadow`}
          >
            ◀ Back
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-32 h-32 mx-auto rounded-full bg-white border-[6px] border-[#FFC83D] shadow-xl overflow-hidden">
            <img src={mamaTitiMain} alt="Mama Titi, FunlyLearn's teacher" className="w-full h-full object-cover object-top" />
          </div>
          <h1 className={`${FUN} text-3xl font-bold text-slate-900`}>
            {signUp ? 'Create your free account' : 'Welcome back!'}
          </h1>
          <p className="font-semibold text-slate-600">
            {signUp ? 'Mama Titi is ready to help with homework!' : 'Log in to keep learning with Mama Titi.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl p-1.5 border-2 border-slate-200" role="tablist">
          <button
            role="tab"
            aria-selected={!signUp}
            onClick={() => switchMode('signin')}
            className={`${FUN} ${PRESS} py-2.5 rounded-xl font-semibold ${!signUp ? 'bg-[#15803D] text-white' : 'text-slate-600'}`}
          >
            Log in
          </button>
          <button
            role="tab"
            aria-selected={signUp}
            onClick={() => switchMode('signup')}
            className={`${FUN} ${PRESS} py-2.5 rounded-xl font-semibold ${signUp ? 'bg-[#15803D] text-white' : 'text-slate-600'}`}
          >
            Create account
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            handleEmailAuth();
          }}
        >
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Parent's email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#15803D] outline-none text-base text-slate-800"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <div className="mt-1 flex items-center rounded-2xl bg-white border-2 border-slate-200 focus-within:border-[#15803D]">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={signUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={signUp ? 'At least 6 characters' : 'Your password'}
                className="flex-1 px-4 py-3.5 bg-transparent outline-none text-base text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="px-4 text-slate-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </label>

          {!signUp && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm font-bold text-[#15803D] underline disabled:opacity-60"
            >
              {resetLoading ? 'Sending reset link...' : 'Forgot password?'}
            </button>
          )}

          {error && (
            <p className="rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm font-semibold px-4 py-3">{error}</p>
          )}
          {infoMsg && (
            <p className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm font-semibold px-4 py-3">{infoMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B] disabled:opacity-70 inline-flex items-center justify-center gap-2`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Please wait...' : signUp ? 'Create account ▶' : 'Log in ▶'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <span className="flex-1 h-px bg-slate-300" />or<span className="flex-1 h-px bg-slate-300" />
        </div>

        <div className="space-y-1.5 text-center pb-6">
          <button
            onPointerDown={e => {
              // Respond before the keyboard closes and moves the button.
              if (e.pointerType !== 'mouse') {
                e.preventDefault();
                startAsGuest();
              }
            }}
            onClick={startAsGuest}
            disabled={guestStarting}
            className={`${FUN} ${PRESS} w-full py-3.5 rounded-2xl bg-white text-[#7E22CE] text-lg font-bold border-2 border-b-[5px] border-[#A855F7]`}
          >
            {guestStarting ? 'Starting…' : 'Try it as a guest'}
          </button>
          <p className="text-sm font-semibold text-slate-600">
            Guests get the 7-day free trial too. Create an account to keep your stars on any phone.
          </p>
        </div>
      </div>
    </div>
  );
};
