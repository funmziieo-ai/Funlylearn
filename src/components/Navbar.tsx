import React from 'react';
import { UserProfile, LanguageCode } from '../types';

interface NavbarProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  onNavigateLanding?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Rebuilt as a light header, per research into how successful kids'
// edtech apps actually handle this: Duolingo, Khan Academy Kids, and
// ClassDojo all use a light/white canvas with ONE saturated brand
// color used purposefully, rather than a fully colored header -- and
// uLesson (a direct Nigerian competitor) uses the same calmer
// approach. Mama Titi's avatar is removed here too: she already
// appears prominently on the sign-in screen, Home dashboard, and
// chat, so the small header circle was the least impactful place she
// showed up, and it was competing for space with the wordmark.
export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onProfileUpdate,
  onNavigateLanding,
  onTabChange
}) => {
  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFBF5] border-b border-[#F1E9DA] shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Wordmark -- text-only now, no avatar */}
        <div
          onClick={onNavigateLanding}
          className="cursor-pointer"
        >
          <span className="font-black text-lg sm:text-xl tracking-tight">
            <span className="text-slate-900">Funly</span>
            <span className="text-[#0E8256]">Learn</span>
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">

          {/* Coins badge — tapping jumps to Naija Lingo, since coins unlock levels there */}
          <button
            onClick={() => onTabChange && onTabChange('lingo')}
            disabled={!onTabChange}
            title="View Naija Lingo levels"
            className="flex items-center space-x-1 bg-[#FFF3D6] hover:bg-[#FFE9B3] px-2.5 py-1 rounded-full border border-[#FFE29A] text-xs font-bold text-[#92650A] transition-colors"
          >
            <span>🪙</span>
            <span>{profile.coins || 0}</span>
          </button>

          {/* Stars badge — tapping jumps to Naija Lingo too, per current app flow */}
          <button
            onClick={() => onTabChange && onTabChange('lingo')}
            disabled={!onTabChange}
            title="View Naija Lingo levels"
            className="flex items-center space-x-1 bg-[#FFF3D6] hover:bg-[#FFE9B3] px-2.5 py-1 rounded-full border border-[#FFE29A] text-xs font-bold text-[#92650A] transition-colors"
          >
            <span>⭐</span>
            <span>{profile.stars}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center bg-[#F1F5F0] p-1 rounded-full border border-[#E2E8DD] text-xs font-bold shadow-inner"
            title="Switch Language"
          >
            <span
              className={
                'px-2 py-0.5 rounded-full transition-all ' +
                (profile.language === 'en'
                  ? 'bg-[#0E8256] text-white'
                  : 'text-slate-500 hover:text-slate-800')
              }
            >
              EN
            </span>
            <span
              className={
                'px-2 py-0.5 rounded-full transition-all ' +
                (profile.language === 'yo'
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-slate-500 hover:text-slate-800')
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
