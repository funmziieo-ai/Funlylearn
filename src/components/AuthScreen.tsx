import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-[#064E3B] flex flex-col items-center px-5 pt-10 pb-8">
      {/* Mascot + welcome */}
      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#FFC107] mb-3">
        <img src="/mama-titi.png" alt="Mama Titi" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-white text-2xl font-bold text-center">Welcome to FunlyLearn!</h1>
      <p className="text-emerald-200 text-sm text-center mt-1 mb-8">
        Learn, play, and grow with Mama Titi
      </p>

      {/* Big primary actions */}
      <div className="w-full max-w-sm space-y-3">
        <button className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-4 shadow-md active:scale-[0.98] transition-transform">
          <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.5-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.6 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.2C40.8 36.6 44 31 44 24c0-1.2-.1-2.5-.4-3.5z"/></svg>
          <span className="font-bold text-slate-800">Continue with Google</span>
        </button>

        <button className="w-full flex items-center justify-center gap-2 bg-[#FFC107] rounded-2xl py-4 shadow-md active:scale-[0.98] transition-transform">
          <Sparkles className="w-5 h-5 text-emerald-900" />
          <span className="font-bold text-emerald-900">Start Learning Now — No Sign Up</span>
        </button>

        <p className="text-center text-emerald-200 text-xs px-4">
          5 free messages a day. Sign up anytime to save your stars.
        </p>
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
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 text-sm font-bold ${mode === 'signin' ? 'bg-[#FFC107] text-emerald-900' : 'text-emerald-200'}`}
              >Sign In</button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-sm font-bold ${mode === 'signup' ? 'bg-[#FFC107] text-emerald-900' : 'text-emerald-200'}`}
              >Create Account</button>
            </div>

            <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
              <Mail className="w-4 h-4 text-emerald-300" />
              <input type="email" placeholder="Enter your email"
                className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none" />
            </div>

            <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
              <Lock className="w-4 h-4 text-emerald-300" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none" />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4 text-emerald-300" /> : <Eye className="w-4 h-4 text-emerald-300" />}
              </button>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] rounded-xl py-3 font-bold text-white">
              {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
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
