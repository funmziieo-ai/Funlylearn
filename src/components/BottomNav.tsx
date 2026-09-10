import React, { useState, useRef, useEffect } from 'react';
import { Home, Search, GraduationCap, Languages, Trophy, Smartphone, MoreHorizontal, User, Crown, X } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenPricingModal?: () => void;
  onOpenProfileModal?: () => void;
}

// Primary tabs reworked per direct feedback: Snap Homework and Exam
// Prep moved out of here -- they're now prominent feature cards on the
// new Home dashboard instead, so nothing is harder to reach, just
// relocated. Subscription and Search take their two slots here, since
// those are the things worth one-tap access to at all times, while
// homework/exam access now naturally starts from Home.
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenPricingModal,
  onOpenProfileModal
}) => {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  // Each primary item either switches to a real tab (isTabItem: true)
  // or fires a modal-opening callback (Subscription) -- Subscription
  // has no matching activeTab since it opens a modal over whatever
  // screen is already showing, rather than navigating away from it.
  const primaryItems = [
    { id: 'home', label: 'Home', icon: Home, onSelect: () => onTabChange('home'), isTabItem: true },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: Crown,
      onSelect: () => onOpenPricingModal && onOpenPricingModal(),
      isTabItem: false
    },
    { id: 'search', label: 'Search', icon: Search, onSelect: () => onTabChange('search'), isTabItem: true }
  ];

  // Everything else lives in one "More" popover -- merged in from the
  // old Navbar three-dot menu, plus Exam Prep now that it's moved out
  // of the primary row (still one tap away, just not permanently
  // visible, since Home's own Exam Prep card covers the common case).
  const moreItems = [
    { id: 'notebook', label: 'Exam Prep', icon: GraduationCap, onSelect: () => onTabChange('notebook'), isTabItem: true },
    { id: 'lingo', label: 'Naija Lingo', icon: Languages, onSelect: () => onTabChange('lingo'), isTabItem: true },
    { id: 'board', label: 'Leaderboard', icon: Trophy, onSelect: () => onTabChange('board'), isTabItem: true },
    { id: 'parent', label: 'Parents', icon: Smartphone, onSelect: () => onTabChange('parent'), isTabItem: true },
    {
      id: 'profile',
      label: 'My Scholar Profile',
      icon: User,
      onSelect: () => (onOpenProfileModal ? onOpenProfileModal() : onTabChange('me')),
      isTabItem: false
    }
  ];

  const isMoreItemActive = moreItems.some((item) => item.isTabItem && item.id === activeTab);

  useEffect(() => {
    if (!showMore) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMore]);

  const handleMoreItemClick = (onSelect: () => void) => {
    onSelect();
    setShowMore(false);
  };

  return (
    <>
      {showMore && (
        <div
          ref={moreRef}
          className="fixed bottom-[64px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xs bg-white rounded-3xl border-2 border-amber-300/70 shadow-2xl overflow-hidden animate-fadeIn"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#064E3B] text-white">
            <span className="text-xs font-jakarta font-bold uppercase tracking-wider text-amber-300">
              More
            </span>
            <button
              onClick={() => setShowMore(false)}
              className="p-1 rounded-full hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isTabItem && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMoreItemClick(item.onSelect)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-[#FFE8DE] text-[#FF6B35] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-sm font-jakarta font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg py-1.5 px-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isTabItem && activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onSelect}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FFE8DE] text-[#FF6B35] font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] sm:text-[11px] font-jakarta mt-0.5 tracking-tight font-semibold whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMore((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
              isMoreItemActive || showMore
                ? 'bg-[#FFE8DE] text-[#FF6B35] font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${isMoreItemActive || showMore ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] sm:text-[11px] font-jakarta mt-0.5 tracking-tight font-semibold whitespace-nowrap">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
