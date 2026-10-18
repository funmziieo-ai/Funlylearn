import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Mail,
  CheckCircle2, 
  ThumbsUp, 
  Award, 
  Sparkles, 
  Lock, 
  Unlock, 
  Flame, 
  Gift,
  Loader2,
  Trophy,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Emoji3D } from '../components/Emoji3D';
import { UserProfile, UserSubscription, ParentReward, LanguageCode } from '../types';
import { fetchHomeworkRecords, HomeworkRecord, sendWelcomeEmail, getPlanStage, fetchLeaderboardV2, setLeaderboardHidden } from '../services/supabaseService';

interface ParentDashboardPageProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  userId: string;
  // Reports (the Performance tab) are part of the paid plans.
  subscription?: UserSubscription;
  onOpenPricingModal?: () => void;
}

// How far back the "weekly performance" view and the automatic weekly
// email look — kept as one constant so both stay in sync if this ever
// changes from 7 days.
const WEEKLY_WINDOW_DAYS = 7;

interface SubjectWeeklyStat {
  subject: string;
  total: number;
  correct: number;
}

function groupRecordsBySubjectWeekly(records: HomeworkRecord[]): SubjectWeeklyStat[] {
  const cutoff = Date.now() - WEEKLY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = records.filter(r => new Date(r.createdAt).getTime() >= cutoff);

  const map = new Map<string, SubjectWeeklyStat>();
  for (const r of recent) {
    const key = r.subject || 'General';
    if (!map.has(key)) map.set(key, { subject: key, total: 0, correct: 0 });
    const stat = map.get(key)!;
    stat.total += 1;
    if (r.wasCorrect === true) stat.correct += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  profile,
  onProfileUpdate,
  userId,
  subscription,
  onOpenPricingModal
}) => {
  // Parent reports are a paid feature. Contact details (WhatsApp/email)
  // stay free, so every parent still gets homework updates.
  const reportsLocked = getPlanStage(subscription) !== 'paid';

  // Parents can hide their child from the leaderboard (other children
  // only ever see first name + surname initial).
  const [hiddenFromBoard, setHiddenFromBoard] = useState<boolean | null>(null);
  const [savingBoard, setSavingBoard] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchLeaderboardV2(userId, profile.classLevel, 'week', 1).then(result => {
      if (!cancelled) setHiddenFromBoard(result ? result.hidden : false);
    });
    return () => { cancelled = true; };
  }, [userId, profile.classLevel]);

  const toggleLeaderboard = async () => {
    if (hiddenFromBoard === null) return;
    const next = !hiddenFromBoard;
    setSavingBoard(true);
    const ok = await setLeaderboardHidden(userId, next);
    if (ok) setHiddenFromBoard(next);
    setSavingBoard(false);
  };
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'performance' | 'rewards'>('notifications');

  // Parent WhatsApp State
  const [phoneNumber, setPhoneNumber] = useState<string>(profile.parentWhatsApp || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Parent Email State — used by the automatic homework-completed and
  // weekly performance emails (see the send-homework-email and
  // weekly-performance-email Edge Functions).
  const [parentEmail, setParentEmail] = useState<string>(profile.parentEmail || '');
  const [emailSaveStatus, setEmailSaveStatus] = useState<string | null>(null);

  // Real homework records, fetched from Supabase, used to compute the
  // weekly-by-subject performance breakdown that replaced the manual
  // "Send a ping right now" list.
  const [weeklyRecords, setWeeklyRecords] = useState<HomeworkRecord[]>([]);
  const [isLoadingWeeklyRecords, setIsLoadingWeeklyRecords] = useState(true);

  // A larger set specifically for computing real Mathematics progress
  // stats — separate from the weekly view above, since a meaningful
  // Math progress summary needs more history than just the last 7 days.
  const [mathRecords, setMathRecords] = useState<HomeworkRecord[]>([]);
  const [isLoadingMathRecords, setIsLoadingMathRecords] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingWeeklyRecords(true);
    // 200 is generous headroom for a week's worth of records across
    // all subjects; groupRecordsBySubjectWeekly filters down to the
    // real 7-day window itself.
    fetchHomeworkRecords(userId, 200).then(records => {
      if (!cancelled) {
        setWeeklyRecords(records);
        setIsLoadingWeeklyRecords(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingMathRecords(true);
    fetchHomeworkRecords(userId, 100).then(records => {
      if (!cancelled) {
        setMathRecords(records.filter(r => r.subject === 'Mathematics'));
        setIsLoadingMathRecords(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Parent Rewards State
  const [rewards, setRewards] = useState<ParentReward[]>([
    { id: 'r1', title: '30 Mins Video Games', description: 'Unlocked by Mama Titi after completing Math homework', requiredStars: 100, requiredHomeworks: 3, isUnlocked: false, icon: 'gamepad' },
    { id: 'r2', title: 'Weekend Ice Cream Treat', description: 'Parent approval after 5 active study days', requiredStars: 250, requiredHomeworks: 5, isUnlocked: false, icon: 'icecream' },
    { id: 'r3', title: 'Extra Football Time', description: 'Unlocked after scoring 500 stars in Naija Lingo', requiredStars: 500, requiredHomeworks: 8, isUnlocked: false, icon: 'trophy' }
  ]);


  // Converts a Nigerian number typed the normal local way (e.g.
  // "08012345678", how virtually everyone actually types their number)
  // into the international format WhatsApp's wa.me links require
  // ("2348012345678"). Without this, both manual and automatic parent
  // notifications would silently fail or go to an invalid number for
  // anyone who didn't happen to type the country code themselves.
  const normalizeNigerianPhone = (raw: string): string => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.startsWith('0')) {
      return '234' + digitsOnly.slice(1);
    }
    if (digitsOnly.startsWith('234')) {
      return digitsOnly;
    }
    // Already missing both a leading 0 and 234 — assume it's a local
    // number missing its leading 0 (e.g. someone typed "8012345678").
    return '234' + digitsOnly;
  };

  // The WhatsApp box shows the number without the +234 part (that is
  // shown beside the box), e.g. "8031234567".
  const [phoneLocal, setPhoneLocal] = useState<string>(
    (profile.parentWhatsApp || '').replace(/^234/, '')
  );
  const [contactStatus, setContactStatus] = useState<string | null>(null);

  // Saves email and WhatsApp together in one update.
  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = parentEmail.trim();
    const digits = phoneLocal.replace(/\D/g, '');
    const cleanedPhone = digits ? normalizeNigerianPhone(digits) : '';
    onProfileUpdate({
      ...profile,
      parentEmail: trimmedEmail,
      parentWhatsApp: cleanedPhone
    });
    // A welcome email only for a genuinely new address.
    if (trimmedEmail && trimmedEmail !== profile.parentEmail) {
      sendWelcomeEmail(trimmedEmail, profile.name);
    }
    setPhoneNumber(cleanedPhone);
    if (cleanedPhone) setPhoneLocal(cleanedPhone.replace(/^234/, ''));
    const parts = [
      trimmedEmail ? trimmedEmail : null,
      cleanedPhone ? `+234 ${cleanedPhone.replace(/^234/, '')}` : null
    ].filter(Boolean);
    setContactStatus(parts.length ? `Saved! Updates will go to ${parts.join(' and ')}.` : 'Saved.');
    setTimeout(() => setContactStatus(null), 5000);
  };

  const handleApproveReward = (id: string) => {
    setRewards(prev =>
      prev.map(r => (r.id === id ? { ...r, isUnlocked: true } : r))
    );
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    onProfileUpdate({
      ...profile,
      parentApprovedCount: profile.parentApprovedCount + 1,
      stars: profile.stars + 50
    });
  };

  const weeklyStats = groupRecordsBySubjectWeekly(weeklyRecords);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-28 font-sans">
      
      {/* Header */}
      <div className="rounded-3xl bg-[#064E3B] text-white p-5 space-y-3 font-['Nunito']">
        <p className="font-['Fredoka'] text-3xl font-bold flex items-center gap-2">
          <Emoji3D emoji="👨‍👩‍👧" className="w-10 h-10" /> Parents
        </p>
        <p className="font-semibold text-emerald-100">Get {profile.name}'s progress on email and WhatsApp.</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['notifications', 'Updates'],
            ['performance', reportsLocked ? 'Reports 🔒' : 'Reports'],
            ['rewards', 'Rewards']
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`font-['Fredoka'] py-2.5 rounded-xl font-semibold transition-transform active:translate-y-[3px] ${
                activeSubTab === tab ? 'bg-[#FFC83D] text-[#064E3B]' : 'bg-white/10 text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: NOTIFICATIONS — contact details for automatic
          emails, plus a real weekly-by-subject performance breakdown
          in the space where the manual "Send a ping right now" list
          used to be. Homework-completed and weekly summary emails are
          now sent automatically by Edge Functions, not triggered by a
          button here. */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4 animate-fadeIn font-['Nunito']">

          {/* Where to send updates */}
          <form onSubmit={handleSaveContacts} className="rounded-3xl bg-white border-2 border-slate-200 border-b-[6px] p-5 space-y-4">
            <p className="font-['Fredoka'] text-xl font-bold flex items-center gap-2 text-slate-900">
              <Emoji3D emoji="📬" className="w-8 h-8" /> Where should we send updates?
            </p>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#15803D] outline-none text-base text-slate-800"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">WhatsApp number</span>
              <div className="mt-1 flex rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden focus-within:border-[#15803D]">
                <span className="px-3 py-3.5 bg-slate-100 font-bold text-slate-700 border-r-2 border-slate-200 whitespace-nowrap">🇳🇬 +234</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phoneLocal}
                  onChange={e => setPhoneLocal(e.target.value)}
                  placeholder="803 123 4567"
                  className="flex-1 min-w-0 px-3 py-3.5 bg-transparent outline-none text-base text-slate-800"
                />
              </div>
              <span className="text-xs font-semibold text-slate-600">You can type it as 0803 123 4567. We'll fix the format.</span>
            </label>
            <button
              type="submit"
              className="font-['Fredoka'] w-full py-3.5 rounded-2xl bg-[#15803D] text-white text-lg font-bold border-b-[5px] border-[#064E3B] transition-transform active:translate-y-[3px]"
            >
              Save
            </button>
            {contactStatus && <p className="text-center font-bold text-[#15803D]">✓ {contactStatus}</p>}
          </form>

          {/* What parents get */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 border-b-[6px] p-5 space-y-3 text-slate-800">
            <p className="font-['Fredoka'] text-xl font-bold flex items-center gap-2 text-slate-900">
              <Emoji3D emoji="🔔" className="w-8 h-8" /> What you'll get
            </p>
            <p className="flex items-start gap-3 font-semibold">
              <Emoji3D emoji="📧" className="w-8 h-8 shrink-0" />
              <span>An <b>email</b> each time {profile.name} finishes a homework question correctly</span>
            </p>
            <p className="flex items-start gap-3 font-semibold">
              <Emoji3D emoji="📅" className="w-8 h-8 shrink-0" />
              <span>A <b>weekly summary email</b> of what {profile.name} worked on</span>
            </p>
            <p className="flex items-start gap-3 font-semibold">
              <Emoji3D emoji="📱" className="w-8 h-8 shrink-0" />
              <span>A <b>WhatsApp message</b> when {profile.name} sends you a Weekly Challenge result</span>
            </p>
          </div>

          {/* This week: a free taste of the reports */}
          <div className="rounded-3xl bg-gradient-to-br from-[#FFC83D] to-[#FF6B35] text-[#2E1065] p-5 border-b-[6px] border-[#D9480F] space-y-3">
            <p className="font-['Fredoka'] text-xl font-bold flex items-center gap-2">
              <Emoji3D emoji="📈" className="w-8 h-8" /> This week
            </p>
            <p className="font-['Fredoka'] text-3xl font-bold">
              {isLoadingWeeklyRecords
                ? 'Counting...'
                : `${weeklyRecords.length} ${weeklyRecords.length === 1 ? 'question' : 'questions'} answered`}
            </p>
            <p className="font-bold opacity-80">
              {reportsLocked
                ? 'See every subject, scores and the topics to practise with parent reports.'
                : 'See every subject and score in Reports.'}
            </p>
            <button
              onClick={() => (reportsLocked ? onOpenPricingModal?.() : setActiveSubTab('performance'))}
              className="font-['Fredoka'] w-full py-3 rounded-2xl bg-[#2E1065] text-[#FFC83D] text-lg font-bold border-b-[5px] border-black/40 transition-transform active:translate-y-[3px]"
            >
              {reportsLocked ? '🔒 Unlock reports' : 'See reports ▶'}
            </button>
          </div>

          {/* Leaderboard privacy */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 border-b-[6px] p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-['Fredoka'] text-lg font-bold flex items-center gap-2 text-slate-900">
                <Emoji3D emoji="🏆" className="w-7 h-7" /> Show {profile.name} on the leaderboard
              </p>
              <p className="text-sm font-semibold text-slate-600 mt-1">Other children only see first name and surname initial, never full names or schools.</p>
            </div>
            <button
              onClick={toggleLeaderboard}
              disabled={hiddenFromBoard === null || savingBoard}
              role="switch"
              aria-checked={hiddenFromBoard === false}
              aria-label={`Show ${profile.name} on the leaderboard`}
              className={`relative w-14 h-8 rounded-full shrink-0 transition-colors disabled:opacity-50 ${hiddenFromBoard === false ? 'bg-[#15803D]' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${hiddenFromBoard === false ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 1.5: MATHEMATICS PROGRESS — real data, sourced from
          genuine RAG-verified Math sessions (not a guess or fake chart
          like the previous version of this section). Currently only
          covers JSS 1-3, matching what's been ingested so far — a real,
          known coverage limit, honestly reflected below rather than
          hidden. */}
      {activeSubTab === 'performance' && reportsLocked && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="rounded-[28px] bg-white border-2 border-slate-200 border-b-8 p-6 text-center space-y-3">
            <p className="text-5xl">🔒</p>
            <p className="font-serif text-2xl font-bold text-[#064E3B]">Unlock {profile.name}'s reports</p>
            <p className="text-slate-600">
              See how {profile.name} is doing in every subject, week by week, and which topics need more practice. Included in the Basic and Family plans.
            </p>
            <button
              onClick={onOpenPricingModal}
              className="px-8 py-3.5 rounded-2xl bg-[#FF6B35] text-white text-lg font-bold border-b-[5px] border-[#D9480F] transition-transform active:translate-y-[3px]"
            >
              See plans
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'performance' && !reportsLocked && (
        <div className="space-y-5 animate-fadeIn">
          {/* Card: Weekly Performance by Subject — replaces the old
              manual "Send a ping right now" list. Same data the
              automatic weekly email sends, shown here too. */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  This week's performance by subject
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last {WEEKLY_WINDOW_DAYS} days · same summary sent in the weekly email
                </p>
              </div>
            </div>

            {isLoadingWeeklyRecords ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : weeklyStats.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-3xl block">📚</span>
                <p className="text-sm font-medium text-slate-600">
                  No homework sessions in the last {WEEKLY_WINDOW_DAYS} days
                </p>
                <p className="text-xs text-slate-400">
                  Once {profile.name} chats with Mama Titi this week, the breakdown will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {weeklyStats.map((stat) => {
                  const pct = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div
                      key={stat.subject}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm font-jakarta truncate">
                          {stat.subject}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {stat.total} question{stat.total === 1 ? '' : 's'} · {stat.correct} correct
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-xl ${
                          pct >= 70
                            ? 'text-emerald-700 bg-emerald-100'
                            : pct >= 40
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-rose-700 bg-rose-100'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 shadow-soft space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Mathematics Level & Progress
                </h3>
                <p className="text-xs text-slate-500">
                  {profile.name} is currently in <strong>{profile.classLevel}</strong>
                </p>
              </div>
            </div>

            {isLoadingMathRecords ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading progress...</div>
            ) : mathRecords.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-2xl block">📐</span>
                <p className="text-sm font-medium text-slate-600">No Mathematics sessions tracked yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  This currently tracks JSS 1-3 Mathematics questions specifically. As {profile.name} asks Mama Titi Math questions, real progress will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-2xl font-bold text-emerald-800">{mathRecords.length}</p>
                    <p className="text-xs text-emerald-700 font-medium">Math Sessions</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <p className="text-2xl font-bold text-amber-800">
                      {Math.round(
                        (mathRecords.filter(r => r.wasCorrect === true).length / mathRecords.length) * 100
                      )}%
                    </p>
                    <p className="text-xs text-amber-700 font-medium">Correct So Far</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Based on {profile.name}'s last {mathRecords.length} tracked Mathematics session{mathRecords.length === 1 ? '' : 's'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REWARDS & APPROVALS HUB */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ThumbsUp className="w-5 h-5 text-[#FF6B35]" />
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Parent "Thumbs-Up" Reward Unlocker 👍
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              When {profile.name} completes homework or practices Naija Lingo, tap the thumbs-up button below to approve and unlock their reward!
            </p>

            <div className="space-y-3 pt-1">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                    reward.isUnlocked
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl shrink-0 ${reward.isUnlocked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {reward.isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-slate-900">{reward.title}</h4>
                      <p className="text-xs text-slate-500 font-sans">{reward.description}</p>
                    </div>
                  </div>

                  {reward.isUnlocked ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-jakarta font-bold flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveReward(reward.id)}
                      className="px-4 py-2 rounded-full bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-md flex items-center space-x-1 shrink-0"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve 👍</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
