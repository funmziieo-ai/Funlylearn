import React, { useState } from 'react';
import { Trophy, Star, Sparkles, Award, ArrowRight } from 'lucide-react';
import { UserProfile, LeaderboardUser } from '../types';
import { INITIAL_LEADERBOARD } from '../data/leaderboardData';

interface LeaderboardPageProps {
  profile: UserProfile;
  onGoToHomework: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ profile, onGoToHomework }) => {
  const [filter, setFilter] = useState<'week' | 'month' | 'allTime'>('week');

  const top1 = INITIAL_LEADERBOARD.find(u => u.rank === 1)!;
  const top2 = INITIAL_LEADERBOARD.find(u => u.rank === 2)!;
  const top3 = INITIAL_LEADERBOARD.find(u => u.rank === 3)!;
  const listUsers = INITIAL_LEADERBOARD.filter(u => u.rank >= 4);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-24 font-sans bg-[#064E3B] text-white min-h-[calc(100vh-120px)]">
      
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center space-x-2">
          <Trophy className="w-8 h-8 text-amber-400 fill-amber-400 animate-pulse" />
          <h1 className="font-serif text-3xl font-bold text-amber-300">Leaderboard</h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-full bg-[#022C22] p-1 font-jakarta font-bold text-xs border border-emerald-700 max-w-sm mx-auto">
        <button
          onClick={() => setFilter('week')}
          className={`flex-1 py-2 rounded-full transition-all ${
            filter === 'week' ? 'bg-[#FFD166] text-slate-900 shadow-md font-bold' : 'text-emerald-200 hover:text-white'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`flex-1 py-2 rounded-full transition-all ${
            filter === 'month' ? 'bg-[#FFD166] text-slate-900 shadow-md font-bold' : 'text-emerald-200 hover:text-white'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setFilter('allTime')}
          className={`flex-1 py-2 rounded-full transition-all ${
            filter === 'allTime' ? 'bg-[#FFD166] text-slate-900 shadow-md font-bold' : 'text-emerald-200 hover:text-white'
          }`}
        >
          All-Time
        </button>
      </div>

      {/* Podium Section (Top 3) */}
      <div className="flex items-end justify-center space-x-3 pt-6 pb-4">
        
        {/* Rank 2 Podium (Tunde) */}
        <div className="flex flex-col items-center w-24">
          <div className="relative mb-2">
            <img
              src={top2.avatarUrl}
              alt={top2.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover bg-emerald-100 border-2 border-emerald-400 ring-2 ring-emerald-300/40 shadow-md p-0.5"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center border border-white">
              2
            </span>
          </div>
          <div className="w-full bg-[#033D2E] rounded-t-2xl p-3 text-center border-t border-emerald-600/50 h-28 flex flex-col justify-end">
            <span className="font-jakarta font-bold text-sm text-white truncate block">{top2.name}</span>
            <span className="text-xs text-amber-300 font-semibold flex items-center justify-center space-x-1">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>{top2.stars}</span>
            </span>
          </div>
        </div>

        {/* Rank 1 Podium (Amara) */}
        <div className="flex flex-col items-center w-28 -mt-4 z-10">
          <div className="relative mb-2">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-300">
              <Star className="w-6 h-6 fill-amber-300 animate-bounce" />
            </div>
            <img
              src={top1.avatarUrl}
              alt={top1.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover bg-amber-100 border-4 border-amber-400 ring-4 ring-amber-400/40 shadow-lg p-0.5"
            />
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-sm">
              1
            </span>
          </div>
          <div className="w-full bg-[#022C22] rounded-t-3xl p-3 text-center border-t-2 border-amber-400 h-36 flex flex-col justify-end shadow-xl">
            <span className="font-jakarta font-bold text-base text-white truncate block">{top1.name}</span>
            <span className="text-xs text-amber-300 font-bold flex items-center justify-center space-x-1">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>{top1.stars}</span>
            </span>
          </div>
        </div>

        {/* Rank 3 Podium (Chidi) */}
        <div className="flex flex-col items-center w-24">
          <div className="relative mb-2">
            <img
              src={top3.avatarUrl}
              alt={top3.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover bg-amber-50 border-2 border-amber-600 ring-2 ring-amber-600/40 shadow-md p-0.5"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center border border-white">
              3
            </span>
          </div>
          <div className="w-full bg-[#033D2E] rounded-t-2xl p-3 text-center border-t border-emerald-600/50 h-24 flex flex-col justify-end">
            <span className="font-jakarta font-bold text-sm text-white truncate block">{top3.name}</span>
            <span className="text-xs text-amber-300 font-semibold flex items-center justify-center space-x-1">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>{top3.stars}</span>
            </span>
          </div>
        </div>

      </div>

      {/* Next in Rank List */}
      <div className="space-y-3">
        <h3 className="text-xs font-jakarta font-bold text-emerald-200 tracking-wide uppercase">
          Next in Rank
        </h3>

        <div className="space-y-2.5">
          {listUsers.map((u) => {
            const isSelf = u.isUser || u.id === 'user-self';
            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-full flex items-center justify-between transition-all ${
                  isSelf
                    ? 'bg-[#E9D5FF] text-slate-900 border-2 border-purple-500 shadow-md scale-102'
                    : 'bg-white text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 text-center font-jakarta font-bold text-sm ${isSelf ? 'text-purple-900' : 'text-purple-700'}`}>
                    {u.rank}
                  </span>
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover bg-emerald-50 border border-slate-200 p-0.5"
                  />
                  <div>
                    <h4 className="font-jakarta font-bold text-sm leading-tight flex items-center space-x-1">
                      <span>{isSelf ? `You (${profile.name}) 🇳🇬` : u.name}</span>
                    </h4>
                    <p className={`text-[11px] ${isSelf ? 'text-purple-800' : 'text-slate-500'} font-sans`}>
                      ⭐ {isSelf ? profile.stars : u.stars} stars
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-jakarta font-bold ${
                  isSelf ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {u.levelBadge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encouragement Banner */}
      <div className="p-5 rounded-3xl bg-[#6D28D9] text-white space-y-3 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1 max-w-xs">
            <h4 className="font-serif font-bold text-lg leading-tight">
              You are #5 this week! 🦾
            </h4>
            <p className="text-xs text-purple-200 font-sans">
              Answer 3 more homework questions with Mama Titi to reach the top 3 podium!
            </p>
          </div>

          <button
            onClick={onGoToHomework}
            className="px-5 py-3 rounded-full bg-[#FF6B35] hover:bg-[#E85523] text-white font-jakarta font-bold text-xs shadow-coral transition-all transform hover:scale-105"
          >
            Go! 🚀
          </button>
        </div>
      </div>

    </div>
  );
};
