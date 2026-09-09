import React, { useState, useRef, useEffect } from 'react';
import { Home, Camera, GraduationCap, Languages, Trophy, Smartphone, MoreHorizontal, User, X } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Consolidated from 6 visible tabs down to 4, per direct parent
// feedback that the nav felt cluttered. The core learning loop (Home,
// Snap Homework, Exam Prep) stays front and center — these are the
// tabs parents specifically said they valued most and a child moves
// between constantly. Lingo, Board, and Parents move into "More"
// rather than disappearing — they're a tap further away, not removed.
const PRIMARY_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Snap Homework', icon: Camera },
  // Fixed a real routing bug here: this was previously id: 'me', which
  // App.tsx actually routes to the Profile page, not Exam Prep — so
  // tapping "Exam Prep" silently opened Profile instead. 'notebook' is
  // the id App.tsx actually uses for SmartNotebookPage (Exam Prep).
  { id: 'notebook', label: 'Exam Prep', icon: GraduationCap }
];

const MORE_ITEMS = [
  { id: 'lingo', label: 'Naija Lingo', icon: Languages },
  { id: 'board', label: 'Leaderboard', icon: Trophy },
  { id: 'parent', label: 'Parents', icon: Smartphone },
  { id: 'me', label: 'My Profile', icon: User }
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  // "More" is active (highlighted) whenever the currently active tab
  // is one of the items tucked inside it — otherwise tapping into
  // Lingo, say, would leave every nav button looking unselected.
  const isMoreItemActive = MORE_ITEMS.some((item) => item.id === activeTab);

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

  const handleMoreItemClick = (id: string) => {
    onTabChange(id);
    setShowMore(false);
  };

  return (
    <>
      {/* "More" popover — sits just above the nav bar itself */}
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
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMoreItemClick(item.id)}
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
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
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
