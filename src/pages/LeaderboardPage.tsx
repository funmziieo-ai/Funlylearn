import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { fetchLeaderboardV2, LeaderboardData, LeaderboardEntry, LeaderboardPeriod } from '../services/supabaseService';
import { Emoji3D } from '../components/Emoji3D';

interface LeaderboardPageProps {
  profile: UserProfile;
  onGoToHomework: () => void;
  // The child's account id (or this device's guest id), so the
  // leaderboard always recognises them correctly.
  userId?: string;
}

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[4px]';
const STARRY: React.CSSProperties = {
  backgroundColor: '#2E1065',
  backgroundImage: [
    'radial-gradient(circle at 15% 8%, rgba(255,200,61,.22), transparent 35%)',
    'radial-gradient(circle at 90% 30%, rgba(56,189,248,.16), transparent 35%)',
    'radial-gradient(circle at 50% 95%, rgba(22,163,74,.2), transparent 40%)',
    'radial-gradient(rgba(255,255,255,.08) 1.5px, transparent 1.5px)'
  ].join(','),
  backgroundSize: 'auto, auto, auto, 26px 26px'
};
const AVATAR_COLORS = ['#16A34A', '#0284C7', '#7E22CE', '#FF6B35', '#E0A800', '#DB2777', '#0D9488'];
const STYLES = `
.lb-bob { animation: lb-bob 1.6s ease-in-out infinite; }
@keyframes lb-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
.lb-rise { animation: lb-rise .5s ease-out both; }
@keyframes lb-rise { 0% { transform: translateY(30px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .lb-bob, .lb-rise { animation: none !important; } }
`;

function colorFor(name: string): string {
  const sum = Array.from(name).reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// Days until the weekly race restarts (Monday, Lagos time).
function daysUntilMonday(): number {
  const lagos = new Date(Date.now() + 60 * 60 * 1000);
  const day = lagos.getUTCDay(); // 0 = Sunday
  return day === 1 ? 7 : (8 - day) % 7;
}

function useFunFonts() {
  useEffect(() => {
    const id = 'funlylearn-fun-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

const Avatar: React.FC<{ entry: LeaderboardEntry; size: string }> = ({ entry, size }) => (
  <span
    className={`${FUN} ${size} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
      entry.isMe ? 'ring-4 ring-[#FFC83D]' : 'ring-2 ring-white/30'
    }`}
    style={{ background: colorFor(entry.name) }}
    aria-hidden="true"
  >
    {entry.name.charAt(0).toUpperCase()}
  </span>
);

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ profile, onGoToHomework, userId }) => {
  useFunFonts();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const celebrated = useRef<Record<string, boolean>>({});
  const userKey = userId || profile.id;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);
    fetchLeaderboardV2(userKey, profile.classLevel, period).then(result => {
      if (cancelled) return;
      setData(result);
      setLoadFailed(!result);
      setIsLoading(false);
      // Confetti once when the child is on the podium.
      if (result?.me && result.me.rank <= 3 && !celebrated.current[period]) {
        celebrated.current[period] = true;
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.35 }, zIndex: 9999, colors: ['#16A34A', '#FFC83D', '#FF6B35', '#38BDF8', '#A855F7'] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userKey, profile.classLevel, period, profile.stars, reloadKey]);

  const rows = data?.rows || [];
  const [p1, p2, p3] = rows;
  const listRows = rows.slice(3);
  const me = data?.me || null;
  const above = data?.above || null;
  const myEntry: LeaderboardEntry | null = me ? { rank: me.rank, name: profile.name || 'You', score: me.score, isMe: true } : null;
  const resetDays = daysUntilMonday();

  const PodiumColumn: React.FC<{ entry: LeaderboardEntry; place: 1 | 2 | 3 }> = ({ entry, place }) => {
    const big = place === 1;
    const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
    return (
      <div className={`lb-rise flex flex-col items-center ${big ? 'w-28' : 'w-24'}`}>
        {big && <Emoji3D emoji="👑" className="lb-bob w-12 h-12 -mb-2 relative z-10" />}
        <div className="relative">
          <Avatar entry={entry} size={big ? 'w-20 h-20 text-4xl' : 'w-16 h-16 text-3xl'} />
          <Emoji3D emoji={medal} className="absolute -bottom-2 -right-3 w-9 h-9" />
        </div>
        <p className={`${FUN} font-bold mt-3 text-center leading-tight ${entry.isMe ? 'text-[#FFC83D]' : ''}`}>
          {entry.isMe ? 'You' : entry.name}
        </p>
        <p className="font-extrabold text-[#FFC83D] inline-flex items-center gap-1">
          <Emoji3D emoji="⭐" className="w-5 h-5" />
          {entry.score}
        </p>
        <div
          className={`w-full mt-2 rounded-t-2xl flex items-start justify-center pt-2 ${
            big ? 'h-28 bg-gradient-to-b from-[#FFC83D] to-[#E0A800]' : place === 2 ? 'h-20 bg-white/15' : 'h-14 bg-white/15'
          }`}
        >
          <span className={`${FUN} text-3xl font-bold ${big ? 'text-[#2E1065]' : 'text-white/80'}`}>{entry.rank}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-6 pb-28 font-['Nunito']">
      <style>{STYLES}</style>
      <div className="relative rounded-[32px] overflow-hidden text-white p-4 sm:p-6 space-y-5 pb-28 min-h-[75vh]" style={STARRY}>
        <div className="text-center space-y-1 pt-1">
          <p className={`${FUN} text-4xl font-bold inline-flex items-center gap-2`}>
            <Emoji3D emoji="🏆" className="lb-bob w-12 h-12" /> Leaderboard
          </p>
          <p className="text-white/80 font-semibold">{profile.classLevel} scholars across Nigeria</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-white/10 rounded-2xl p-1.5 max-w-sm mx-auto">
          {(['week', 'all'] as LeaderboardPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`${FUN} ${PRESS} py-2.5 rounded-xl font-semibold ${period === p ? 'bg-[#FFC83D] text-[#2E1065]' : 'text-white/80'}`}
            >
              {p === 'week' ? 'This week' : 'All time'}
            </button>
          ))}
        </div>
        {period === 'week' && (
          <p className="text-center text-sm font-bold text-[#FFC83D] -mt-2">
            ⏰ New race starts Monday · {resetDays === 7 ? 'started today!' : `${resetDays} ${resetDays === 1 ? 'day' : 'days'} left`}
          </p>
        )}

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Emoji3D emoji="🏆" className="lb-bob w-16 h-16 mx-auto" />
            <p className="font-semibold text-white/80">Loading the scholars...</p>
          </div>
        ) : loadFailed ? (
          <div className="rounded-3xl bg-white/10 p-6 text-center space-y-3">
            <Emoji3D emoji="😕" className="w-14 h-14 mx-auto" />
            <p className="font-semibold">The leaderboard didn't load. Check your internet and try again.</p>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className={`${FUN} ${PRESS} px-6 py-3 rounded-2xl bg-[#FFC83D] text-[#2E1065] font-bold border-b-[5px] border-[#E0A800]`}
            >
              🔄 Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl bg-white/10 p-6 text-center space-y-3">
            <Emoji3D emoji="🌱" className="w-14 h-14 mx-auto" />
            <p className={`${FUN} text-2xl font-bold text-[#FFC83D]`}>
              {period === 'week' ? 'A brand new race!' : `Be the first ${profile.classLevel} scholar!`}
            </p>
            <p className="font-semibold text-white/85">Win your first star with Mama Titi and take the top spot.</p>
            <button
              onClick={onGoToHomework}
              className={`${FUN} ${PRESS} px-6 py-3.5 rounded-2xl bg-[#FFC83D] text-[#2E1065] text-lg font-bold border-b-[5px] border-[#E0A800]`}
            >
              Win stars now ▶
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-center gap-2 sm:gap-3 pt-6">
              {p2 && <PodiumColumn entry={p2} place={2} />}
              {p1 && <PodiumColumn entry={p1} place={1} />}
              {p3 && <PodiumColumn entry={p3} place={3} />}
            </div>

            {/* Goal card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#FFC83D] to-[#FF6B35] p-4 text-[#2E1065] border-b-[6px] border-[#D9480F] space-y-3">
              {data?.hidden ? (
                <p className={`${FUN} text-xl font-bold`}>Your parent has hidden you from the leaderboard. You can still win stars!</p>
              ) : !me ? (
                <div className="flex items-center gap-3">
                  <Emoji3D emoji="🌟" className="w-12 h-12 shrink-0" />
                  <p className={`${FUN} text-2xl font-bold leading-tight`}>Win your first star to join the board!</p>
                </div>
              ) : !above ? (
                <div className="flex items-center gap-3">
                  <Emoji3D emoji="👑" className="w-12 h-12 shrink-0" />
                  <p className={`${FUN} text-2xl font-bold leading-tight`}>You're number 1! Keep your crown!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Emoji3D emoji="🎯" className="w-12 h-12 shrink-0" />
                    <div>
                      <p className={`${FUN} text-2xl font-bold leading-tight`}>
                        {above.score - me.score + 1} more {above.score - me.score + 1 === 1 ? 'star' : 'stars'} to pass {above.name.split(' ')[0]}!
                      </p>
                      <p className="font-bold opacity-80">You're number {me.rank} {period === 'week' ? 'this week' : 'of all time'}</p>
                    </div>
                  </div>
                  <div className="h-4 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full rounded-full bg-[#15803D]" style={{ width: `${Math.round((me.score / (above.score + 1)) * 100)}%` }} />
                  </div>
                </>
              )}
              <button
                onClick={onGoToHomework}
                className={`${FUN} ${PRESS} w-full py-3 rounded-2xl bg-[#2E1065] text-[#FFC83D] text-lg font-bold border-b-[5px] border-black/40`}
              >
                Win stars now ▶
              </button>
            </div>

            {listRows.length > 0 && (
              <div className="space-y-2">
                {listRows.map(entry => (
                  <div
                    key={`${entry.rank}-${entry.name}`}
                    className={`rounded-2xl px-3 py-2.5 flex items-center gap-3 ${entry.isMe ? 'bg-[#FFC83D] text-[#2E1065]' : 'bg-white/10'}`}
                  >
                    <span className={`${FUN} w-8 text-center text-xl font-bold`}>{entry.rank}</span>
                    <Avatar entry={entry} size="w-11 h-11 text-xl" />
                    <span className={`${FUN} text-lg font-semibold flex-1 truncate`}>{entry.isMe ? `You (${entry.name.split(' ')[0]})` : entry.name}</span>
                    <span className="font-extrabold inline-flex items-center gap-1 text-lg">
                      <Emoji3D emoji="⭐" className="w-6 h-6" />
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* How to win stars */}
        <div className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 space-y-2">
          <p className={`${FUN} text-xl font-bold inline-flex items-center gap-2`}>
            <Emoji3D emoji="⭐" className="w-7 h-7" /> How to win stars
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-bold">
            <p className="rounded-2xl bg-white/10 px-3 py-2 flex items-center gap-2"><Emoji3D emoji="💬" className="w-7 h-7 shrink-0" />Homework with Mama Titi</p>
            <p className="rounded-2xl bg-white/10 px-3 py-2 flex items-center gap-2"><Emoji3D emoji="🏆" className="w-7 h-7 shrink-0" />Weekly Challenge</p>
            <p className="rounded-2xl bg-white/10 px-3 py-2 flex items-center gap-2"><Emoji3D emoji="🎓" className="w-7 h-7 shrink-0" />Exam Prep</p>
            <p className="rounded-2xl bg-white/10 px-3 py-2 flex items-center gap-2"><Emoji3D emoji="🎮" className="w-7 h-7 shrink-0" />Game Zone</p>
          </div>
        </div>

        {/* The child's own row, always visible */}
        {myEntry && !isLoading && (
          <div className="absolute left-3 right-3 bottom-3 sm:left-6 sm:right-6">
            <div className="rounded-2xl bg-white text-[#2E1065] shadow-2xl px-3 py-2.5 flex items-center gap-3 border-b-4 border-slate-300">
              <span className={`${FUN} w-8 text-center text-xl font-bold`}>{myEntry.rank}</span>
              <Avatar entry={myEntry} size="w-11 h-11 text-xl" />
              <span className={`${FUN} text-lg font-bold flex-1`}>You</span>
              <span className="font-extrabold inline-flex items-center gap-1 text-lg">
                <Emoji3D emoji="⭐" className="w-6 h-6" />
                {myEntry.score}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
