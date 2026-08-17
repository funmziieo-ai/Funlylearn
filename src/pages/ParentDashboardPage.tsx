import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  ThumbsUp, 
  Award, 
  Sparkles, 
  Lock, 
  Unlock, 
  Flame, 
  MessageSquare, 
  Gift,
  Loader2,
  Trophy,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, ParentReward, LanguageCode } from '../types';
import { fetchHomeworkRecords, HomeworkRecord } from '../services/supabaseService';

interface ParentDashboardPageProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  userId: string;
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

  // Real homework records, fetched from Supabase instead of hardcoded
  const [recentRecords, setRecentRecords] = useState<HomeworkRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  // A larger set specifically for computing real Mathematics progress
  // stats — separate from the small "recent activity" list above, since
  // a meaningful progress summary needs more history than just the last
  // 5 sessions shown elsewhere on this page.
  const [mathRecords, setMathRecords] = useState<HomeworkRecord[]>([]);
  const [isLoadingMathRecords, setIsLoadingMathRecords] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRecords(true);
    fetchHomeworkRecords(userId, 5).then(records => {
      if (!cancelled) {
        setRecentRecords(records);
        setIsLoadingRecords(false);
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

  const handleSendPing = (record: HomeworkRecord) => {
    setSentIds(prev => new Set(prev).add(record.id));

    const resultLine =
      record.wasCorrect === true
        ? 'and got it correct! ✅'
        : record.wasCorrect === false
        ? 'and is still practicing this one 💪'
        : 'with Mama Titi';

    const textMessage = encodeURIComponent(
      `🌟 *Mama Titi Learning Ping* 🌟\n\nHello Parent!\n${profile.name} just worked on: "${record.topic}" ${resultLine}\n\nTotal Stars Earned: ⭐ ${profile.stars}\nKeep encouraging ${profile.name}! 🎉`
    );

    const cleanNum = normalizeNigerianPhone(profile.parentWhatsApp || phoneNumber);
    if (!cleanNum) {
      alert('Please save a parent WhatsApp number first.');
      return;
    }
    const waUrl = `https://wa.me/${cleanNum}?text=${textMessage}`;
    window.open(waUrl, '_blank');

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });
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
          {activeSubTab === 'notifications' && 'When you finish a homework or quest, your parents get an instant WhatsApp ping.'}
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
            <Smartphone className="w-3.5 h-3.5" />
            <span>📲 WhatsApp Notifications</span>
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

      {/* SUB-TAB 1: WHATSAPP NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Card 1: Parent's WhatsApp Number */}
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

          {/* Card 2: Send a ping right now — now real records */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📨</span>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Send a ping right now
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Tell parents about your most recent homework sessions.
            </p>

            {isLoadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-3xl block">📚</span>
                <p className="text-sm font-medium text-slate-600">
                  No homework sessions yet
                </p>
                <p className="text-xs text-slate-400">
                  Once {profile.name} chats with Mama Titi, real sessions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => {
                  const isSent = sentIds.has(record.id);
                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm font-jakarta truncate">
                          {record.topic}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                        {record.wasCorrect !== null && (
                          <span
                            className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              record.wasCorrect
                                ? 'text-emerald-700 bg-emerald-100'
                                : 'text-amber-700 bg-amber-100'
                            }`}
                          >
                            {record.wasCorrect ? 'Answered correctly ✅' : 'Still practicing 💪'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleSendPing(record)}
                          className="p-2.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white shadow-xs transition-all flex items-center justify-center"
                          title="Send via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 fill-white" />
                        </button>

                        <button
                          onClick={() => handleSendPing(record)}
                          className="px-4 py-2 rounded-full bg-[#064E3B] hover:bg-[#022C22] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isSent ? 'Sent 👍' : 'Tell parents'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: HOW IT WORKS Banner */}
          <div className="bg-[#FFFDF5] p-5 sm:p-6 rounded-3xl border-2 border-amber-300/60 shadow-soft space-y-3">
            <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-amber-700">
              HOW IT WORKS
            </h4>
            <ol className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-decimal list-inside font-medium">
              <li>Snap your homework and let Mama Titi explain it step-by-step.</li>
              <li>Tap "Tell parents" — we open WhatsApp with the message ready.</li>
              <li>Parents see the win and can reply with 🎉 or unlock rewards!</li>
            </ol>
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
