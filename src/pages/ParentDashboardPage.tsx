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
import { UserProfile, ParentReward, LanguageCode } from '../types';
import { fetchHomeworkRecords, HomeworkRecord } from '../services/supabaseService';

interface ParentDashboardPageProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  userId: string;
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
  userId
}) => {
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

  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
  };

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

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeNigerianPhone(phoneNumber);
    onProfileUpdate({
      ...profile,
      parentWhatsApp: cleaned
    });
    setSaveStatus('WhatsApp number saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileUpdate({
      ...profile,
      parentEmail: parentEmail.trim()
    });
    setEmailSaveStatus('Email saved — you\'ll get automatic updates here!');
    setTimeout(() => setEmailSaveStatus(null), 3000);
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
      
      {/* Primary Top Header (Mama Titi Design Language) */}
      <div className="bg-[#064E3B] text-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400/40 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-800/40 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-300/30 shrink-0">
              <Smartphone className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  Parent Portal
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                {activeSubTab === 'notifications' && 'Parent Notifications'}
                {activeSubTab === 'performance' && 'Child Performance Dashboard'}
                {activeSubTab === 'rewards' && 'Reward & Approvals Hub'}
              </h1>
            </div>
          </div>

          <button
            onClick={toggleLanguage}
            className="self-start sm:self-center flex items-center bg-[#022C22] p-1 rounded-full border border-amber-400/30 text-xs font-jakarta font-bold text-white shadow-inner"
            title="Switch Language (English / Yoruba)"
          >
            <span
              className={`px-3 py-1 rounded-full transition-all flex items-center space-x-1 ${
                profile.language === 'en'
                  ? 'bg-white text-[#064E3B] shadow-xs font-extrabold'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </span>
            <span
              className={`px-3 py-1 rounded-full transition-all flex items-center space-x-1 ${
                profile.language === 'yo'
                  ? 'bg-[#FF6B35] text-white shadow-xs font-extrabold'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <span>🇳🇬</span>
              <span>YO</span>
            </span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100 font-sans leading-relaxed max-w-xl">
          {activeSubTab === 'notifications' && 'When homework is completed, parents get an automatic email — no action needed here.'}
          {activeSubTab === 'performance' && `Track ${profile.name}'s learning milestones.`}
          {activeSubTab === 'rewards' && `Approve reward requests with a thumbs-up to motivate ${profile.name}'s study habits!`}
        </p>

        <div className="flex items-center space-x-2 pt-2 border-t border-emerald-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2 rounded-2xl text-xs font-jakarta font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === 'notifications'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-4 py-2 rounded-2xl text-xs font-jakarta font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === 'performance'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>📊 Progress</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`px-4 py-2 rounded-2xl text-xs font-jakarta font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === 'rewards'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 Rewards ({rewards.filter(r => !r.isUnlocked).length} Pending)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: NOTIFICATIONS — contact details for automatic
          emails, plus a real weekly-by-subject performance breakdown
          in the space where the manual "Send a ping right now" list
          used to be. Homework-completed and weekly summary emails are
          now sent automatically by Edge Functions, not triggered by a
          button here. */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-5 animate-fadeIn">

          {/* Card: Parent's Email — powers the automatic emails */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Parent's email
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Homework-completed alerts and a weekly summary are sent here automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEmail} className="space-y-3">
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#064E3B] focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm outline-none transition-all placeholder:text-slate-400"
              />

              {emailSaveStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emailSaveStatus}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] text-white font-jakarta font-bold text-sm shadow-xs transition-all text-center flex items-center justify-center space-x-2"
              >
                <span>Save email</span>
              </button>
            </form>
          </div>

          {/* Card: Parent's WhatsApp Number — kept for the existing
              automatic every-3rd-correct-answer WhatsApp ping from
              ChatPage.tsx, unrelated to this email feature. */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Parent's WhatsApp number
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Include country code, no spaces. E.g. 2348012345678
              </p>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2348012345678"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#064E3B] focus:ring-2 focus:ring-emerald-200 text-slate-800 font-mono text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {saveStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveStatus}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#FFB088] hover:bg-[#FF9B68] text-slate-900 font-jakarta font-bold text-sm shadow-xs transition-all text-center flex items-center justify-center space-x-2"
              >
                <span>Save number</span>
              </button>
            </form>
          </div>

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

        </div>
      )}

      {/* SUB-TAB 1.5: MATHEMATICS PROGRESS — real data, sourced from
          genuine RAG-verified Math sessions (not a guess or fake chart
          like the previous version of this section). Currently only
          covers JSS 1-3, matching what's been ingested so far — a real,
          known coverage limit, honestly reflected below rather than
          hidden. */}
      {activeSubTab === 'performance' && (
        <div className="space-y-5 animate-fadeIn">
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
