import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MoreVertical, Crown, User, Mic } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';
import mamaTitiImg from '../assets/images/mama_titi_official_1784860280943.jpg';

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
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
  };

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
          {/* Mama Titi circle image with Nigerian flag */}
          <div className="relative">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-sm group-hover:scale-105 transition-transform">
              {!imgError ? (
                <img
                  src={mamaTitiImg}
                  alt="Mama Titi"
                  onError={() => setImgError(true)}
                  className="w-9 h-9 rounded-full object-cover object-top border-2 border-amber-300"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#00A651] flex items-center justify-center border-2 border-amber-300">
                  <span className="text-white font-black text-base">M</span>
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
              🇳🇬
            </span>
          </div>

          {/* FunlyLearn text */}
          <div className="flex flex-col leading-tight">
            <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-amber-200 transition-colors">
              Funly<span className="text-amber-300">Learn</span>
            </span>
            <span className="text-[9px] text-emerald-300 font-bold tracking-wide hidden sm:block">
              Mama Titi AI Teacher
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">

          {/* Coins badge */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#022C22] px-2.5 py-1 rounded-full border border-amber-400/30 text-xs font-bold text-amber-300">
            <span>🪙</span>
            <span>{profile.coins || 0}</span>
          </div>

          {/* Stars badge */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#022C22] px-2.5 py-1 rounded-full border border-amber-400/30 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{profile.stars}</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center bg-[#022C22] p-1 rounded-full border border-emerald-700 text-xs font-bold text-white shadow-inner"
            title="Switch Language"
          >
            <span
              className={
                'px-2 py-0.5 rounded-full transition-all ' +
                (profile.language === 'en'
                  ? 'bg-white text-[#064E3B]'
                  : 'text-emerald-200 hover:text-white')
              }
            >
              EN
            </span>
            <span
              className={
                'px-2 py-0.5 rounded-full transition-all ' +
                (profile.language === 'yo'
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-emerald-200 hover:text-white')
              }
            >
              YO
            </span>
          </button>

          {/* Three dots menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-amber-300 hover:text-white hover:bg-emerald-800 rounded-full transition-colors flex items-center justify-center border border-amber-400/30 bg-[#022C22]"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border-2 border-amber-400/80 py-2 z-50 font-sans">

                {/* Profile header in menu — text only, avatar removed since it duplicated the brand logo above */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Scholar
                  </p>
                  <p className="text-xs font-bold text-[#064E3B]">
                    {profile.name} · {profile.classLevel}
                  </p>
                </div>

                {/* Subscription */}
                {onOpenPricingModal && (
                  <button
                    onClick={() => handleMenuItemClick(onOpenPricingModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 font-bold text-xs flex items-center space-x-2.5 transition-colors group border-b border-slate-100"
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

                {/* Voice Key */}
                {onOpenVoiceKeyModal && (
                  <button
                    onClick={() => handleMenuItemClick(onOpenVoiceKeyModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 font-bold text-xs flex items-center space-x-2.5 transition-colors group border-b border-slate-100"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-700 text-amber-300 group-hover:scale-105 transition-transform">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">Voice Settings 🎙️</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Mama Titi voice settings
                      </span>
                    </div>
                  </button>
                )}

                {/* Profile */}
                {onOpenProfileModal ? (
                  <button
                    onClick={() => handleMenuItemClick(onOpenProfileModal)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 font-bold text-xs flex items-center space-x-2.5 transition-colors group"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-100 text-[#064E3B]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">My Scholar Profile 👤</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Edit name and class level
                      </span>
                    </div>
                  </button>
                ) : onTabChange ? (
                  <button
                    onClick={() => handleMenuItemClick(() => onTabChange('me'))}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 font-bold text-xs flex items-center space-x-2.5 transition-colors group"
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-100 text-[#064E3B]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">My Scholar Profile 👤</span>
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Edit name and class level
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
