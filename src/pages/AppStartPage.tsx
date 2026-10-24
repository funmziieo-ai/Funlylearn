import React, { useEffect, useRef, useState } from 'react';
import { Emoji3D } from '../components/Emoji3D';
import { ANKARA, ANKARA_DOTS, HERO_PHOTO, STYLES, MovingGreeting, StoryChat, useFunFonts } from './LandingPage';

// The first page in the FunlyLearn app for children who aren't signed in
// yet. The top is the same as the website's; the rest of the website's
// sections are folded into slides, so the page stays short on a phone.

interface AppStartPageProps {
  onStart: () => void; // Start 7 days free / Create a free account
  onLogIn: () => void;
}

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[4px]';

const SLIDES: { emoji?: string; label?: string; title: string; text: string; className: string; textClass: string }[] = [
  { emoji: '📸', title: 'Snap any question', text: 'Explained step by step, with stories about markets, Naira and jollof.', className: 'bg-[#FFF4D1] border-[#E0A800]', textClass: 'text-slate-600' },
  { emoji: '📒', title: 'Your own notebook', text: 'Every question you ask Mama Titi becomes a note. Revise before tests; hard topics come back each week until you get them right.', className: 'bg-[#DCFCE7] border-[#15803D]', textClass: 'text-slate-700' },
  { emoji: '🎮', title: 'Games made just for you', text: 'Play games with questions from what you learnt this week, with music, coins and confetti.', className: 'bg-[#2E1065] border-black/40 text-white', textClass: 'text-purple-100' },
  { emoji: '🎓', title: 'Exam practice', text: 'Practise for Common Entrance, BECE and WAEC. After each question, Mama Titi shows you the right answer and why.', className: 'bg-[#E0F4FF] border-[#38BDF8]', textClass: 'text-slate-600' },
  { label: 'For parents', title: 'See how your child is doing', text: 'Get results on WhatsApp and a report for each subject, every week.', className: 'bg-[#064E3B] border-black/30 text-white', textClass: 'text-emerald-100' }
];

export const AppStartPage: React.FC<AppStartPageProps> = ({ onStart, onLogIn }) => {
  useFunFonts();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const [photoMissing, setPhotoMissing] = useState(false);

  // Slides move on their own every 4 seconds (not while touched).
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      if (!paused) setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused]);

  const goTo = (i: number) => setSlide((i + SLIDES.length) % SLIDES.length);

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-slate-800 font-['Nunito']">
      <style>{STYLES}</style>

      {/* Top: the same as the website */}
      <div className="relative" style={ANKARA_DOTS}>
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <div className={`${FUN} w-9 h-9 rounded-2xl bg-[#15803D] text-white text-xl font-bold flex items-center justify-center border-b-4 border-[#064E3B]`}>F</div>
            <span className={`${FUN} text-xl font-bold text-slate-900`}>Funly<span className="text-[#15803D]">Learn</span></span>
          </div>
          <button onClick={onLogIn} className="font-bold text-slate-700 px-3 py-2">Log in</button>
        </div>

        <div className="px-5 pt-4 space-y-3 max-w-xl mx-auto">
          <MovingGreeting />
          <h1 className={`${FUN} text-[40px] font-bold leading-[1.02] text-slate-900`}>
            Homework made easy, <span className="text-[#15803D]">the Naija way</span>
          </h1>
          <p className="text-[16px] font-semibold text-slate-600">
            Mama Titi helps with your homework, then turns it into <b className="text-slate-800">your own notes, quizzes and games</b>.
          </p>
          <button
            onClick={onStart}
            className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B]`}
          >
            Start 7 days free ▶
          </button>
          <p className={`${FUN} inline-flex items-center gap-2 font-semibold text-[#7E22CE]`}>
            <Emoji3D emoji="🎮" className="lp-wiggle w-7 h-7" />
            Psst… a secret Game Zone is hiding inside. Can you unlock it?
          </p>
          <p className="text-[13px] font-bold text-slate-600">No debit card needed · Follows the NERDC curriculum, Primary 3 to SS3</p>
        </div>

        <div className="relative px-5 pt-4 pb-6 max-w-xl mx-auto">
          {!photoMissing && (
            <img
              src={HERO_PHOTO}
              alt="A smiling Nigerian girl doing homework on a phone"
              onError={() => setPhotoMissing(true)}
              className="w-full aspect-square object-cover rounded-[28px] border-4 border-white shadow-xl"
              style={{ objectPosition: '50% 25%' }}
            />
          )}
          <div className={`relative ${photoMissing ? '' : '-mt-28'} mx-2 rounded-3xl bg-white/95 shadow-2xl border-2 border-emerald-100 p-3`}>
            <div className="min-h-[200px]">
              <StoryChat compact />
            </div>
          </div>
        </div>
        <div className="h-2" style={ANKARA} />
      </div>

      {/* Made from your homework: the website's sections as slides */}
      <div className="px-4 pt-5 max-w-xl mx-auto">
        <h2 className={`${FUN} text-2xl font-bold text-center text-slate-900`}>Made from your homework</h2>
        <p className="text-[15px] font-semibold text-center text-slate-600 mt-1">
          Every question you ask Mama Titi becomes a note in Create Notebook.
        </p>
        <div
          className="mt-3 overflow-hidden rounded-[24px]"
          onPointerDown={e => { startX.current = e.clientX; setPaused(true); }}
          onPointerUp={e => {
            if (startX.current !== null) {
              const dx = e.clientX - startX.current;
              if (Math.abs(dx) > 40) goTo(slide + (dx < 0 ? 1 : -1));
            }
            startX.current = null;
            setTimeout(() => setPaused(false), 3000);
          }}
          onPointerLeave={() => { startX.current = null; setPaused(false); }}
          role="region"
          aria-label="FunlyLearn features"
        >
          <div
            className="flex items-stretch"
            style={{ transform: `translateX(-${slide * 100}%)`, transition: 'transform .45s cubic-bezier(.3,.8,.3,1)' }}
          >
            {SLIDES.map((s, i) => (
              <div key={i} className="min-w-full" aria-hidden={i !== slide}>
                <div className={`h-full min-h-[140px] rounded-[24px] border-b-[5px] p-4 ${s.className}`}>
                  {s.label && <p className={`${FUN} text-[#FFC83D] font-bold text-sm`}>{s.label}</p>}
                  <div className="flex items-center gap-2">
                    {s.emoji && <Emoji3D emoji={s.emoji} className="w-10 h-10 shrink-0" />}
                    <p className={`${FUN} text-lg font-bold`}>{s.title}</p>
                  </div>
                  <p className={`text-sm font-semibold mt-1.5 ${s.textClass}`}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-0.5 pt-1.5">
          {SLIDES.map((s, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Show ${s.title}`} className="p-1.5">
              <span className={`block h-2.5 rounded-full transition-all ${i === slide ? 'w-7 bg-[#15803D]' : 'w-2.5 bg-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Ready to try it? (as on the website) */}
      <div className="px-5 pt-6 pb-6 text-center space-y-3 max-w-xl mx-auto">
        <h2 className={`${FUN} text-3xl font-bold text-slate-900`}>Ready to try it?</h2>
        <button
          onClick={onStart}
          className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B]`}
        >
          Create a free account ▶
        </button>
      </div>

      <div className="h-1.5" style={ANKARA} />
      <footer className="bg-[#064E3B] text-center py-4">
        <p className={`${FUN} text-lg font-bold text-white`}>Funly<span className="text-[#FFC83D]">Learn</span> 🇳🇬</p>
        <p className="text-sm font-semibold text-emerald-100">Made in Nigeria, for Nigerian children</p>
      </footer>
    </div>
  );
};
