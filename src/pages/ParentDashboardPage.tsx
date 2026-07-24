import React, { useState } from 'react';
import { 
  Smartphone, 
  Send, 
  CheckCircle2, 
  ThumbsUp, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  Award, 
  Sparkles, 
  Lock, 
  Unlock, 
  Clock, 
  Flame, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Share2, 
  Check, 
  HelpCircle,
  ExternalLink,
  Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, ParentReward, LanguageCode } from '../types';

interface ParentDashboardPageProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  profile,
  onProfileUpdate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'performance' | 'rewards'>('notifications');

  // Parent WhatsApp State
  const [phoneNumber, setPhoneNumber] = useState<string>(profile.parentWhatsApp || '2348012345678');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [recentAssignments, setRecentAssignments] = useState([
    { id: 'a1', subject: 'Mathematics', topic: 'Fractions & Ratios', timestamp: '16/07/2026, 18:25:40', score: '100%', sent: false },
    { id: 'a2', subject: 'Yoruba Language', topic: 'Owe Yoruba (Proverbs)', timestamp: '16/07/2026, 15:10:12', score: '95%', sent: true },
    { id: 'a3', subject: 'Basic Science', topic: 'Living & Non-Living Things', timestamp: '15/07/2026, 11:45:00', score: '90%', sent: true }
  ]);

  // Parent Rewards State
  const [rewards, setRewards] = useState<ParentReward[]>([
    { id: 'r1', title: '30 Mins Video Games', description: 'Unlocked by Mama Titi after completing Math homework', requiredStars: 100, requiredHomeworks: 3, isUnlocked: true, icon: 'gamepad' },
    { id: 'r2', title: 'Weekend Ice Cream Treat', description: 'Parent approval after 5 active study days', requiredStars: 250, requiredHomeworks: 5, isUnlocked: false, icon: 'icecream' },
    { id: 'r3', title: 'Extra Football Time', description: 'Unlocked after scoring 500 stars in Naija Lingo', requiredStars: 500, requiredHomeworks: 8, isUnlocked: false, icon: 'trophy' }
  ]);

  const toggleLanguage = () => {
    const newLang: LanguageCode = profile.language === 'en' ? 'yo' : 'en';
    onProfileUpdate({ ...profile, language: newLang });
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');
    onProfileUpdate({
      ...profile,
      parentWhatsApp: cleaned
    });
    setSaveStatus('WhatsApp number saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSendPing = (assignmentId: string) => {
    setRecentAssignments(prev =>
      prev.map(a => (a.id === assignmentId ? { ...a, sent: true } : a))
    );

    const assignment = recentAssignments.find(a => a.id === assignmentId);
    const textMessage = encodeURIComponent(
      `🌟 *Mama Titi Learning Ping* 🌟\n\nHello Parent!\n${profile.name} just completed an assignment on *${assignment?.subject || 'Homework'}* (${assignment?.topic || 'Topic'}) with a score of *${assignment?.score || '100%'}*!\n\nTotal Stars Earned: ⭐ ${profile.stars}\nKeep encouraging ${profile.name}! 🎉`
    );

    const cleanNum = (profile.parentWhatsApp || phoneNumber).replace(/\D/g, '');
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
        {/* Background Decorative Accent */}
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
                <span className="text-xs text-emerald-200">Real-Time Insights</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                {activeSubTab === 'notifications' && 'Parent Notifications'}
                {activeSubTab === 'performance' && 'Child Performance Dashboard'}
                {activeSubTab === 'rewards' && 'Reward & Approvals Hub'}
              </h1>
            </div>
          </div>

          {/* Language Switch Button EN / YO */}
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
          {activeSubTab === 'performance' && `Track ${profile.name}'s subject proficiency, homework activity, and learning milestones.`}
          {activeSubTab === 'rewards' && `Approve reward requests with a thumbs-up to motivate ${profile.name}'s study habits!`}
        </p>

        {/* Sub-Navigation Tabs */}
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
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 Performance Dashboard</span>
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

          {/* Card 2: Send a ping right now */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📨</span>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Send a ping right now
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Tell parents about your most recent assignment.
            </p>

            <div className="space-y-3">
              {recentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-jakarta">
                      {assignment.subject}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {assignment.timestamp}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Score: {assignment.score}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {/* WhatsApp Action Button */}
                    <button
                      onClick={() => handleSendPing(assignment.id)}
                      className="p-2.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white shadow-xs transition-all flex items-center justify-center"
                      title="Send via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                    </button>

                    {/* Approve Button */}
                    <button
                      onClick={() => handleSendPing(assignment.id)}
                      className="px-4 py-2 rounded-full bg-[#064E3B] hover:bg-[#022C22] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-amber-300" />
                      <span>{assignment.sent ? 'Sent 👍' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

      {/* SUB-TAB 2: CHILD PERFORMANCE DASHBOARD */}
      {activeSubTab === 'performance' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-jakarta font-bold uppercase">Learning Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-[#064E3B] font-jakarta">
                92%
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">18 Quests Mastered</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-jakarta font-bold uppercase">Study Streak</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 font-jakarta">
                {profile.streakDays} Days
              </p>
              <p className="text-[10px] text-amber-700 font-medium">Active Learner 🔥</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-jakarta font-bold uppercase">Total Stars</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-[#FF6B35] font-jakarta">
                ⭐ {profile.stars}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Level {profile.level} Scholar</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-jakarta font-bold uppercase">Study Time</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-[#064E3B] font-jakarta">
                14.5 hrs
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">This Week</p>
            </div>

          </div>

          {/* Subject Mastery Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#064E3B]" />
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Subject Proficiency & NERDC Alignment
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {profile.classLevel}
              </span>
            </div>

            <div className="space-y-4">
              
              {/* Math */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span>📐</span>
                    <span>Mathematics</span>
                  </span>
                  <span className="text-[#064E3B]">94% Mastery (12 Topics)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-[#064E3B] rounded-full" style={{ width: '94%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Topics: Fractions, Ratios, Simple Equations, Word Problems</p>
              </div>

              {/* Yoruba */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span>🇳🇬</span>
                    <span>Yoruba Language & Culture</span>
                  </span>
                  <span className="text-amber-600">88% Mastery (9 Topics)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: '88%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Topics: Greetings (Ikini), Yoruba Proverbs (Owe), Family Vocab</p>
              </div>

              {/* English */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span>📖</span>
                    <span>English & Literature</span>
                  </span>
                  <span className="text-emerald-700">91% Mastery (15 Topics)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-700 rounded-full" style={{ width: '91%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Topics: Parts of Speech, Comprehension, Creative Composition</p>
              </div>

              {/* Basic Science */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span>🔬</span>
                    <span>Basic Science & Tech</span>
                  </span>
                  <span className="text-teal-700">85% Mastery (8 Topics)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#064E3B] rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Topics: Living Organisms, Forms of Energy, Environmental Care</p>
              </div>

              {/* Social Studies */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span>🌍</span>
                    <span>Social Studies & Civic Ed</span>
                  </span>
                  <span className="text-amber-700">90% Mastery (10 Topics)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '90%' }} />
                </div>
                <p className="text-[11px] text-slate-500">Topics: Nigerian Culture, Civic Duties, National Values</p>
              </div>

            </div>
          </div>

          {/* Weekly Learning Activity Chart */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Weekly Study Minutes (Mon - Sun)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-jakarta font-bold">
                Avg: 73 mins/day
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-36 pt-6 px-2 border-b border-slate-100">
              {[
                { day: 'Mon', mins: 45, height: '40%' },
                { day: 'Tue', mins: 60, height: '55%' },
                { day: 'Wed', mins: 30, height: '30%' },
                { day: 'Thu', mins: 90, height: '80%' },
                { day: 'Fri', mins: 75, height: '65%' },
                { day: 'Sat', mins: 120, height: '100%' },
                { day: 'Sun', mins: 50, height: '45%' }
              ].map((bar) => (
                <div key={bar.day} className="flex flex-col items-center space-y-1 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.mins}m
                  </span>
                  <div 
                    className="w-full max-w-[28px] bg-[#064E3B] hover:bg-[#FF6B35] rounded-t-lg transition-all duration-300" 
                    style={{ height: bar.height }}
                  />
                  <span className="text-[11px] font-jakarta text-slate-600 font-semibold pt-1">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Educator Feedback Note */}
          <div className="bg-[#022C22] text-white p-5 rounded-3xl border-2 border-amber-400/40 shadow-md space-y-2">
            <div className="flex items-center space-x-2 text-amber-300">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-serif font-bold text-sm">Mama Titi's Teacher Recommendation</h4>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed font-sans">
              "{profile.name} is making phenomenal progress in {profile.classLevel} Mathematics and Yoruba oral traditions! We recommend 15 minutes of daily parent-guided reading in Yoruba proverbs to maintain this top streak."
            </p>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: REWARDS & APPROVALS HUB */}
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
