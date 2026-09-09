import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { UserProfile, LanguageCode } from '../types';
import mamaTitiImg from '../assets/images/mama_titi_official_1784860280943.jpg';

interface NavbarProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  onNavigateLanding?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// The three-dot menu previously lived here, holding two items:
// "Subscription & Billing" and "My Scholar Profile". Per direct parent
// feedback that the app had too many separate menus, both items moved
// into BottomNav's "More" popover instead — one place to find
// everything that isn't a primary tab, rather than two different menus
// (header dots + bottom nav) a parent had to check separately.
export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onProfileUpdate,
  onNavigateLanding,
  onTabChange
}) => {
  const [imgError, setImgError] = useState(false);

  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
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

          {/* Coins badge — tapping jumps to Naija Lingo, since coins unlock levels there */}
          <button
            onClick={() => onTabChange && onTabChange('lingo')}
            disabled={!onTabChange}
            title="View Naija Lingo levels"
            className="flex items-center space-x-1 bg-[#022C22] hover:bg-emerald-900 px-2.5 py-1 rounded-full border border-amber-400/30 text-xs font-bold text-amber-300 transition-colors"
          >
            <span>🪙</span>
            <span>{profile.coins || 0}</span>
          </button>

          {/* Stars badge — tapping jumps to Naija Lingo too, per current app flow */}
          <button
            onClick={() => onTabChange && onTabChange('lingo')}
            disabled={!onTabChange}
            title="View Naija Lingo levels"
            className="flex items-center space-x-1 bg-[#022C22] hover:bg-emerald-900 px-2.5 py-1 rounded-full border border-amber-400/30 text-xs font-bold text-amber-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{profile.stars}</span>
          </button>

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

        </div>
      </div>
    </header>
  );
};
