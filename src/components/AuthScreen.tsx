import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { MamaTitiAvatar } from './MamaTitiAvatar';
import { signUpWithEmail, signInWithEmail, signInWithGoogleOAuth, resetPasswordForEmail } from '../services/supabaseService';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onContinueAsGuest
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);
    const { user, error } = await signInWithGoogleOAuth();
    setIsLoading(false);
    if (error) {
      setErrorMessage(error);
    } else if (user) {
      onAuthSuccess(user);
    }
  };

  // Handle Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email and password, my child!');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { user, error } = await signInWithEmail(email.trim(), password.trim());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      onAuthSuccess(user);
    }
  };

  // Handle Email Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter an email and password to create your account!');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password should be at least 6 characters long, ọmọ mi!');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { user, error } = await signUpWithEmail(email.trim(), password.trim());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      setInfoMessage('Account created successfully! Welcome to FunlyLearn 🌟');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 800);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address to reset password!');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { success, message } = await resetPasswordForEmail(email.trim());
    setIsLoading(false);

    if (success) {
      setInfoMessage(message);
    } else {
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#064E3B] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Decorative subtle background blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#022C22] border-2 border-amber-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Centered Top Illustration & Logo Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block mx-auto">
            <div className="w-32 h-32 rounded-full border-4 border-amber-400 overflow-hidden shadow-lg mx-auto bg-emerald-900 flex items-center justify-center">
              <MamaTitiAvatar size="lg" showOnlineStatus={false} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <img
                src="/assets/images/funlylearn_logo.jpg"
                alt="FunlyLearn Logo"
                className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <h1 className="font-serif text-3xl font-bold text-amber-300 tracking-tight">
                FunlyLearn 🌟
              </h1>
            </div>
            <p className="text-xs text-emerald-100 font-sans mt-1">
              Fun While Learning · Official NERDC Nigerian Curriculum
            </p>
          </div>
        </div>

        {/* Error / Info Messages Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-medium flex items-start space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-900/90 border border-emerald-400 text-emerald-100 text-xs font-medium flex items-start space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* Option 1: Google Sign In */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-3 text-xs text-emerald-200">
            <div className="flex-1 border-t border-emerald-800" />
            <span className="px-3 text-emerald-300 font-mono">─── or ───</span>
            <div className="flex-1 border-t border-emerald-800" />
          </div>
        </div>

        {/* Option 2: Email & Password Form */}
        {mode !== 'forgot' ? (
          <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-jakarta font-semibold text-emerald-200 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#064E3B] border border-amber-400/40 text-white placeholder-emerald-300/60 font-sans text-sm outline-none focus:border-amber-400"
                />
                <Mail className="w-4 h-4 text-emerald-300 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-jakarta font-semibold text-emerald-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#064E3B] border border-amber-400/40 text-white placeholder-emerald-300/60 font-sans text-sm outline-none focus:border-amber-400"
                />
                <Lock className="w-4 h-4 text-emerald-300 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-emerald-300 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Buttons: Sign In / Create Account */}
            <div className="space-y-2 pt-2">
              {mode === 'signin' ? (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-amber-400/60 text-amber-300 hover:bg-amber-400/10 font-bold text-xs transition-all text-center"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#E85523] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 text-emerald-200 hover:bg-emerald-800/20 font-semibold text-xs transition-all text-center"
                  >
                    Already have an account? Sign In
                  </button>
                </>
              )}
            </div>

            {/* Forgot password link */}
            {mode === 'signin' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs text-emerald-300 hover:text-amber-300 transition-colors"
                >
                  Forgot password? Reset here
                </button>
              </div>
            )}
          </form>
        ) : (
          /* Forgot password form */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-serif text-base font-bold text-amber-300">
                Reset Password
              </h3>
              <p className="text-xs text-emerald-200">
                Enter your registered email address and we'll send you a password reset link.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#064E3B] border border-amber-400/40 text-white placeholder-emerald-300/60 text-sm outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset Link</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="w-full py-2.5 text-xs text-emerald-200 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Guest mode button below all options */}
        <div className="pt-4 border-t border-emerald-800/80 text-center">
          <button
            onClick={onContinueAsGuest}
            className="text-xs text-amber-300/90 hover:text-amber-300 font-jakarta font-semibold underline underline-offset-4 flex items-center justify-center space-x-1 mx-auto transition-colors"
          >
            <span>Continue without account →</span>
          </button>
          <p className="text-[11px] text-emerald-300/70 mt-1 font-sans">
            Guest mode allows 5 free messages daily. Sign up anytime to save child stars & notebook notes!
          </p>
        </div>

      </div>
    </div>
  );
};
