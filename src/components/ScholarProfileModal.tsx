import React, { useState } from 'react';
import { UserProfile, ClassLevel, LanguageCode, UserSubscription } from '../types';
import { X, User, Edit2, LogOut, CheckCircle, Sparkles } from 'lucide-react';

interface ScholarProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  userEmail?: string;
  onProfileUpdate: (updated: UserProfile) => void;
  onSignOut?: () => void;
}

export const ScholarProfileModal: React.FC<ScholarProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  userEmail,
  onProfileUpdate,
  onSignOut
}) => {
  const [name, setName] = useState(profile.name);
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel);
  const [isOutOfSchool, setIsOutOfSchool] = useState(profile.isOutOfSchool);
  const [language, setLanguage] = useState<LanguageCode>(profile.language);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const classes: ClassLevel[] = [
    'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileUpdate({
      ...profile,
      name,
      classLevel,
      isOutOfSchool,
      language
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden font-jakarta text-slate-800 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#022C22] text-white p-4 px-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white leading-tight">
                Scholar Profile Settings
              </h3>
              <p className="text-[11px] text-emerald-200">
                {userEmail || 'Scholar Account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Scholar profile updated successfully! 🌟</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Scholar Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Class Level</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-emerald-100 bg-white"
            >
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Preferred Language</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-[#064E3B] text-white border-[#064E3B]'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                English 🇬🇧
              </button>
              <button
                type="button"
                onClick={() => setLanguage('yo')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  language === 'yo'
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Yoruba 🇳🇬
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">Out-of-School Catch-Up?</span>
              <span className="text-[10px] text-slate-500 block">Adapt lessons for foundational learning</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOutOfSchool(!isOutOfSchool)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-colors ${
                isOutOfSchool ? 'bg-[#FF6B35]' : 'bg-slate-400'
              }`}
            >
              {isOutOfSchool ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-all"
            >
              <Edit2 className="w-4 h-4 text-amber-300" />
              <span>Save Scholar Profile</span>
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
