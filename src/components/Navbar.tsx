import React, { useState, useRef, useEffect } from 'react';
import { Bell, BookOpen, Sparkles, MoreVertical, Crown, User, Smartphone, BookMarked, ShieldCheck, Key, Mic } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';

interface NavbarProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  onNavigateLanding?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenPricingModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenVoiceKeyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onProfileUpdate,
  onNavigateLanding,
  activeTab,
  onTabChange,
  onOpenPricingModal,
  onOpenProfileModal,
  onOpenVoiceKeyModal
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#064E3B] text-white shadow-md border-b border-[#0A5D46]">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={onNavigateLanding}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
            <img
              src="/assets/images/funlylearn_logo.jpg"
              alt="FunlyLearn Logo"
              className="w-8 h-8 rounded-full object-cover border border-amber-300"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
            FunlyLearn
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Stars badge */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#022C22] px-2.5 py-1 rounded-full border border-amber-400/30 text-xs font-jakarta text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{profile.stars} stars</span>
          </div>

          {/* Language Toggle: EN / YO */}
          <button
            onClick={toggleLanguage}
            className="flex items-center bg-[#022C22] p-1 rounded-full border border-emerald-700 text-xs font-jakarta font-bold text-white shadow-inner"
            title="Switch Language (English / Yoruba)"
          >
            <span
              className={`px-2 py-0.5 rounded-full transition-all ${
                profile.language === 'en'
                  ? 'bg-white text-[#064E3B] shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              EN
            </span>
            <span
              className={`px-2 py-0.5 rounded-full transition-all ${
                profile.language === 'yo'
                  ? 'bg-[#FF6B35] text-white shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              YO
            </span>
          </button>

          {/* Notification bell */}
          <button className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-800 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B35]" />
          </button>

          {/* Three Dots Menu Button (Top Right) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-amber-300 hover:text-white hover:bg-emerald-800 rounded-full transition-colors flex items-center justify-center border border-amber-400/30 bg-[#022C22]"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border-2 border-amber-400/80 py-2 z-50 font-jakarta animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    App Settings
                  </p>
                  <p className="text-xs font-serif font-bold text-[#064E3B]">
                    {profile.name} ({profile.classLevel})
                  </p>
                </div>

                {/* Subscription & Billing Option */}
                {onOpenPricingModal && (
                  <button
                    onClick={() => handleMenuItemClick(onOpenPricingModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-slate-900 font-bold text-xs flex items-center space-x-2.5 transition-colors group border-b border-slate-100"
                  >
                    <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950 group-hover:scale-105 transition-transform">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">Subscription & Billing 💳</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Upgrade plan or view status
                      </span>
                    </div>
                  </button>
                )}

                {/* YarnGPT Idera Voice Key Option */}
                {onOpenVoiceKeyModal && (
                  <button
                    onClick={() => handleMenuItemClick(onOpenVoiceKeyModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-slate-900 font-bold text-xs flex items-center space-x-2.5 transition-colors group border-b border-slate-100"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-700 text-amber-300 group-hover:scale-105 transition-transform">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">YarnGPT Voice Key 🎙️</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Idera Yoruba Voice API key
                      </span>
                    </div>
                  </button>
                )}

                {/* My Scholar Profile Option */}
                {onOpenProfileModal ? (
                  <button
                    onClick={() => handleMenuItemClick(onOpenProfileModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center space-x-2.5 transition-colors group"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-100 text-[#064E3B]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">My Scholar Profile 👤</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Edit scholar name & class
                      </span>
                    </div>
                  </button>
                ) : onTabChange ? (
                  <button
                    onClick={() => handleMenuItemClick(() => onTabChange('me'))}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center space-x-2.5 transition-colors group"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-100 text-[#064E3B]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">My Scholar Profile 👤</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Edit scholar name & class
                      </span>
                    </div>
                  </button>
                ) : null}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};


