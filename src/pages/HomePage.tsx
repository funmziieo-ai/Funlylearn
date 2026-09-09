import React, { useState, useEffect } from 'react';
import { Camera, GraduationCap, Languages, Trophy, Sparkles, Flame, ChevronRight, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
import { fetchHomeworkRecords, HomeworkRecord } from '../services/supabaseService';

interface HomePageProps {
  profile: UserProfile;
  userId: string;
  onNavigate: (tab: string) => void;
}

// A real dashboard, not another route to the chat screen. Matches how
// every major kids-learning app (Duolingo, Khan Academy Kids, uLesson)
// structures Home: a greeting, progress at a glance, and clear cards
// into each major feature -- never a feature itself. Previously "Home"
// and "Snap Homework" both just dropped the child into the identical
// chat screen with nothing distinguishing them.
export const HomePage: React.FC<HomePageProps> = ({ profile, userId, onNavigate }) => {
  const isYoruba = profile.language === 'yo';
  const [recentRecord, setRecentRecord] = useState<HomeworkRecord | null>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHomeworkRecords(userId, 1).then((records) => {
      if (!cancelled) {
        setRecentRecord(records.length > 0 ? records[records.length - 1] : null);
        setIsLoadingRecent(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hour = new Date().getHours();
  const greeting = isYoruba
    ? 'Ẹ ku ọjọ'
    : hour < 12
    ? 'Good morning'
    : hour < 17
    ? 'Good afternoon'
    : 'Good evening';

  const featureCards = [
    {
      id: 'chat',
      title: isYoruba ? 'Ṣe Aworan Iṣẹ Ile' : 'Snap Homework',
      subtitle: isYoruba
        ? 'Ya aworan tabi kọ ibeere kan fun Mama Titi'
        : 'Photo a question or ask Mama Titi anything',
      icon: Camera,
      bg: 'from-amber-400 via-amber-300 to-amber-500',
      iconBg: 'bg-slate-950 text-amber-300'
    },
    {
      id: 'notebook',
      title: isYoruba ? 'Múra Sílẹ̀ Fún Àyẹ̀wò' : 'Exam Prep',
      subtitle: isYoruba
        ? 'Ṣe àdánwò gidi fún BECE, WAEC àti FSLC'
        : 'Real practice for BECE, WAEC & FSLC',
      icon: GraduationCap,
      bg: 'from-emerald-600 via-emerald-500 to-emerald-700',
      iconBg: 'bg-slate-950 text-emerald-300'
    },
    {
      id: 'lingo',
      title: isYoruba ? 'Naija Lingo' : 'Naija Lingo',
      subtitle: isYoruba
        ? 'Kọ Yoruba nipasẹ ere igbadun'
        : 'Learn Yoruba through fun games',
      icon: Languages,
      bg: 'from-purple-500 via-purple-400 to-purple-600',
      iconBg: 'bg-slate-950 text-purple-200'
    },
    {
      id: 'board',
      title: isYoruba ? 'Táabù Olùdarí' : 'Leaderboard',
      subtitle: isYoruba
        ? 'Wo bí o ṣe wà láàrin àwọn akẹ́kọ̀ọ́ mìíràn'
        : 'See how you rank among other scholars',
      icon: Trophy,
      bg: 'from-orange-500 via-orange-400 to-orange-600',
      iconBg: 'bg-slate-950 text-orange-200'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-28 font-sans">

      {/* Greeting header */}
      <div className="bg-[#064E3B] text-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-800/40 blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <MamaTitiAvatar size="md" showOnlineStatus={false} />
          <div>
            <p className="text-xs text-emerald-200 font-sans">{greeting},</p>
            <h1 className="font-serif text-2xl font-bold text-white">
              {profile.name}!
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-[#022C22]/60 rounded-2xl p-3 border border-amber-400/20 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-300 font-bold text-lg">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>{profile.stars}</span>
            </div>
            <p className="text-[10px] text-emerald-200 font-jakarta font-bold uppercase tracking-wide mt-0.5">
              {isYoruba ? 'Awọn Irawọ' : 'Stars'}
            </p>
          </div>
          <div className="flex-1 bg-[#022C22]/60 rounded-2xl p-3 border border-amber-400/20 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-300 font-bold text-lg">
              <span>🪙</span>
              <span>{profile.coins || 0}</span>
            </div>
            <p className="text-[10px] text-emerald-200 font-jakarta font-bold uppercase tracking-wide mt-0.5">
              {isYoruba ? 'Owó' : 'Coins'}
            </p>
          </div>
          <div className="flex-1 bg-[#022C22]/60 rounded-2xl p-3 border border-amber-400/20 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-300 font-bold text-lg">
              <Flame className="w-4 h-4" />
              <span>{profile.correctStreak || 0}</span>
            </div>
            <p className="text-[10px] text-emerald-200 font-jakarta font-bold uppercase tracking-wide mt-0.5">
              {isYoruba ? 'Ọjọ́ Tí Ó Tẹ̀lé' : 'Streak'}
            </p>
          </div>
        </div>
      </div>

      {/* Continue where you left off -- only shows once real history exists */}
      {!isLoadingRecent && recentRecord && (
        <button
          onClick={() => onNavigate('chat')}
          className="w-full bg-white p-4 rounded-3xl border-2 border-slate-200 hover:border-emerald-300 shadow-soft text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-slate-400">
                {isYoruba ? 'Tẹ̀síwájú Ìkẹ́kọ̀ọ́' : 'Continue Learning'}
              </p>
              <p className="font-jakarta font-bold text-sm text-slate-900 truncate">
                {recentRecord.topic}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      )}

      {/* Feature cards -- the actual "Home" content: clear entry points
          into each major feature, not a feature itself */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className={`bg-gradient-to-br ${card.bg} p-4 rounded-3xl shadow-md text-left transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group`}
            >
              <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-950">
                {card.title}
              </h3>
              <p className="text-xs text-slate-900/70 font-sans mt-0.5 leading-snug">
                {card.subtitle}
              </p>
            </button>
          );
        })}
      </div>

    </div>
  );
};
