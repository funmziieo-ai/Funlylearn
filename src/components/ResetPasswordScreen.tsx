import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { MamaTitiAvatar } from './MamaTitiAvatar';

interface ResetPasswordScreenProps {
  onComplete: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!supabase) {
      setError('Unable to connect right now. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#064E3B] flex flex-col items-center px-5 pt-10 pb-8">
      <MamaTitiAvatar size="xl" showOnlineStatus={false} className="mb-3" />

      {success ? (
        <div className="w-full max-w-sm text-center space-y-4 mt-6">
          <h1 className="text-white text-2xl font-bold">Password Updated!</h1>
          <p className="text-emerald-200 text-sm">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 bg-[#FFC107] rounded-2xl py-4 shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="font-bold text-emerald-900">Continue to Sign In</span>
            <ArrowRight className="w-4 h-4 text-emerald-900" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4 mt-2">
          <h1 className="text-white text-2xl font-bold text-center">Set a New Password</h1>
          <p className="text-emerald-200 text-sm text-center">
            Choose a new password for your FunlyLearn account.
          </p>

          <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
            <Lock className="w-4 h-4 text-emerald-300" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none"
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-4 h-4 text-emerald-300" /> : <Eye className="w-4 h-4 text-emerald-300" />}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#022C22] rounded-xl px-3 py-3">
            <Lock className="w-4 h-4 text-emerald-300" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-transparent flex-1 text-white placeholder-emerald-400 text-sm outline-none"
            />
          </div>

          {error && (
            <p className="text-center text-red-300 text-xs px-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] rounded-xl py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Updating...' : (
              <>
                Set New Password <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
