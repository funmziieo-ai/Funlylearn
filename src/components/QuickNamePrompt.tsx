import React, { useEffect, useRef, useState } from 'react';
import { ClassLevel, UserProfile } from '../types';

// A small, optional "What's your name?" card for players who arrive from
// a game invite link without signing up. It pops up inside the game,
// stays about 12 seconds, then slides away by itself if ignored. It
// shows at most once per visit.

const CLASSES: ClassLevel[] = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
const SEEN_KEY = 'funlylearn_name_prompt_seen';
const SHOW_AFTER_MS = 1500;
const STAY_MS = 12000;

function seenThisVisit(): boolean {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (_e) { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (_e) {}
}

interface QuickNamePromptProps {
  profile: UserProfile;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const QuickNamePrompt: React.FC<QuickNamePromptProps> = ({ profile, onProfileUpdate }) => {
  const needsName = !profile.name || profile.name.trim().length === 0;
  const [visible, setVisible] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [name, setName] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel || 'JSS 1');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pop up shortly after the game opens.
  useEffect(() => {
    if (!needsName || !onProfileUpdate || seenThisVisit()) return;
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [needsName, onProfileUpdate]);

  // Slide away on its own, unless the child starts typing.
  useEffect(() => {
    if (!visible || engaged) return;
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      markSeen();
    }, STAY_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, engaged]);

  if (!visible || !needsName || !onProfileUpdate) return null;

  const close = () => {
    setVisible(false);
    markSeen();
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onProfileUpdate({ ...profile, name: trimmed, classLevel });
    close();
  };

  return (
    <div className="fixed left-3 right-3 bottom-24 z-[65] flex justify-center pointer-events-none">
      <form
        onSubmit={save}
        onFocus={() => setEngaged(true)}
        className="qnp-in pointer-events-auto w-full max-w-sm rounded-3xl bg-white text-slate-800 shadow-2xl border-2 border-emerald-100 p-4 space-y-3 font-['Nunito'] overflow-hidden relative"
      >
        <style>{`
          .qnp-in { animation: qnp-in .35s ease-out; }
          @keyframes qnp-in { 0% { transform: translateY(40px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
          .qnp-bar { animation: qnp-bar ${STAY_MS}ms linear forwards; }
          @keyframes qnp-bar { 0% { width: 100% } 100% { width: 0% } }
          @media (prefers-reduced-motion: reduce) { .qnp-in, .qnp-bar { animation: none; } }
        `}</style>
        {!engaged && <div className="qnp-bar absolute top-0 left-0 h-1 bg-[#FFC83D]" aria-hidden="true" />}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-['Fredoka'] text-lg font-bold text-[#064E3B]">👋 Hi! What's your name?</p>
            <p className="text-sm font-semibold text-slate-600">So Mama Titi can cheer for you. You can skip this.</p>
          </div>
          <button type="button" onClick={close} aria-label="Skip" className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-600 shrink-0">✕</button>
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            maxLength={30}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#15803D] outline-none text-base"
          />
          <select
            value={classLevel}
            onChange={e => setClassLevel(e.target.value as ClassLevel)}
            aria-label="Your class"
            className="px-2 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-base font-semibold"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="font-['Fredoka'] flex-1 py-2.5 rounded-2xl bg-[#15803D] text-white font-bold border-b-4 border-[#064E3B] disabled:opacity-50 transition-transform active:translate-y-[3px]"
          >
            Save
          </button>
          <button type="button" onClick={close} className="px-4 py-2.5 rounded-2xl font-bold text-slate-600">
            Not now
          </button>
        </div>
      </form>
    </div>
  );
};
