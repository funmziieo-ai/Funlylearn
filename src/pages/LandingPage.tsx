import React, { useEffect, useState } from 'react';
import mamaTitiMain from '../assets/images/mama_titi_official_1784860280943.jpg';
import { Emoji3D } from '../components/Emoji3D';

interface LandingPageProps {
  onStartLearning: () => void;
  onStartCatchingUp: () => void;
  onLogIn?: () => void;
  onSignUp?: () => void;
}

// Put a real photo of a Nigerian child doing homework on a phone at
// public/assets/images/landing-hero.jpg and it shows here automatically.
// Until then, a phone mock-up of Mama Titi's chat is shown instead.
export const HERO_PHOTO = '/assets/images/landing-hero.jpg';

// English first, then Yorùbá, Igbo and Hausa, one at a time.
const GREETINGS = ['Welcome', 'Ẹ káàbọ̀', 'Nnọọ', 'Barka da zuwa'];

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[4px]';
export const ANKARA: React.CSSProperties = {
  backgroundColor: '#064E3B',
  backgroundImage: [
    'linear-gradient(135deg, #FFC83D 25%, transparent 25%)',
    'linear-gradient(225deg, #FFC83D 25%, transparent 25%)',
    'linear-gradient(45deg, #FF6B35 25%, transparent 25%)',
    'linear-gradient(315deg, #FF6B35 25%, transparent 25%)'
  ].join(','),
  backgroundSize: '28px 28px'
};
export const ANKARA_DOTS: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(circle at 10px 10px, rgba(255,200,61,.35) 3px, transparent 3.5px)',
    'radial-gradient(circle at 24px 24px, rgba(255,107,53,.25) 3px, transparent 3.5px)'
  ].join(','),
  backgroundSize: '28px 28px'
};

export const STYLES = `
.lp-greet { display: inline-block; transition: transform .35s ease, opacity .35s ease; }
.lp-greet.out { transform: translateY(-100%); opacity: 0; }
.lp-greet.in { transform: translateY(100%); opacity: 0; transition: none; }
.lp-float { animation: lp-float 3.2s ease-in-out infinite; }
.lp-float2 { animation: lp-float 3.8s ease-in-out infinite .6s; }
@keyframes lp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
.lp-wiggle { animation: lp-wiggle 2.4s ease-in-out infinite; }
@keyframes lp-wiggle { 0%,85%,100% { transform: rotate(0) } 90% { transform: rotate(-8deg) } 95% { transform: rotate(8deg) } }
.lp-pop { animation: lp-pop .3s ease-out; }
@keyframes lp-pop { 0% { transform: scale(.85); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .lp-float, .lp-float2, .lp-wiggle, .lp-greet, .lp-pop { animation: none !important; transition: none !important; } }
`;

export function useFunFonts() {
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

export const MovingGreeting: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'' | 'out' | 'in'>('');

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setPhase('out');
      setTimeout(() => {
        setIndex(i => (i + 1) % GREETINGS.length);
        setPhase('in');
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase('')));
      }, 350);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={`${FUN} inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-amber-200 font-semibold text-[#064E3B] overflow-hidden`}>
      <span aria-hidden="true">👋🏾</span>
      <span className={`lp-greet min-w-[8.5rem] text-left ${phase}`}>{GREETINGS[index]}</span>
    </span>
  );
};

// Mama Titi explains homework with everyday Nigerian life. The chat on
// the landing page cycles through these, one conversation at a time.
interface Story {
  label: string;
  question: string;
  story: string;
  answer: string;
}

const STORIES: Story[] = [
  { label: 'Primary 4 · Maths', question: 'What is 3 × 50?', story: 'Chidi buys 3 puff-puff at ₦50 each from Mama Bisi. How much does he pay?', answer: '₦150!' },
  { label: 'Primary 5 · Maths', question: 'How do I share 24 by 4?', story: 'Ifeoma picks 24 mangoes and shares them equally with 4 friends. How many does each friend get?', answer: '6 mangoes each!' },
  { label: 'English · Folktale', question: 'What is the moral of the story?', story: 'Greedy Tortoise ate all the food at the sky feast, so the birds took back their feathers. What lesson does it teach?', answer: "Don't be greedy!" },
  { label: 'Basic Science', question: 'What is evaporation?', story: 'Mama spreads wet clothes on the line in the hot sun. By afternoon they are dry. Where did the water go?', answer: 'It turned into water vapour!' },
  { label: 'JSS 1 · Maths', question: 'How do I divide 12 by 3?', story: 'A keke carries 3 children at a time. 12 children are going to school. How many trips will it make?', answer: '4 trips!' },
  { label: 'Primary 6 · Maths', question: 'What fraction is 2 out of 8?', story: 'Mummy cuts a watermelon into 8 slices and Tolu eats 2. What fraction did Tolu eat?', answer: '2/8, that is 1/4!' },
  { label: 'English · Grammar', question: 'Which word is the verb?', story: 'At inter-house sports, Musa kicks the ball into the net. Which word shows the action?', answer: 'Kicks!' },
  { label: 'Primary 5 · Time', question: 'How do I add time?', story: "School closes at 2:00pm and Ada's bus ride home takes 45 minutes. What time does she get home?", answer: '2:45pm!' },
  { label: 'Basic Science', question: 'What do plants need to grow?', story: "Grandpa plants yams on his farm in the village. What do the yams need to grow big and strong?", answer: 'Sunlight, water, air and soil!' },
  { label: 'Primary 4 · Maths', question: 'What is 6 × 5?', story: 'The suya man puts 5 pieces on each stick. Daddy buys 6 sticks. How many pieces is that?', answer: '30 pieces!' },
  { label: 'JSS 2 · Maths', question: 'What is 18 out of 20 as a percentage?', story: 'Zainab scores 18 out of 20 in her Maths test. What percentage did she get?', answer: '90%!' }
];

// One conversation plays out, then the next story begins.
export const StoryChat: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [storyIndex, setStoryIndex] = useState(0);
  const [step, setStep] = useState(4); // 1 question, 2 story, 3 answer, 4 praise

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timings = [0, 1100, 3600, 4800];
    let timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      setStep(0);
      timings.forEach((t, i) => timers.push(setTimeout(() => setStep(i + 1), t + 200)));
    };
    play();
    const cycle = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = [];
      setStoryIndex(i => (i + 1) % STORIES.length);
      play();
    }, 7800);
    return () => {
      clearInterval(cycle);
      timers.forEach(clearTimeout);
    };
  }, []);

  const s = STORIES[storyIndex];
  const text = compact ? 'text-[13px]' : 'text-sm';
  return (
    <div className={`space-y-2.5 font-['Nunito'] ${text}`}>
      <p className="text-center text-xs font-bold text-slate-500">Mama Titi · {s.label}</p>
      {step >= 1 && (
        <div className="lp-pop ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-[#FFE8DE] px-3 py-2 font-semibold text-slate-800">{s.question}</div>
      )}
      {step === 1 && (
        <div className="max-w-[40%] rounded-2xl rounded-tl-md bg-white border-2 border-emerald-100 px-3 py-2 text-slate-400 font-bold tracking-widest">• • •</div>
      )}
      {step >= 2 && (
        <div className="lp-pop max-w-[90%] rounded-2xl rounded-tl-md bg-white border-2 border-emerald-100 px-3 py-2 text-slate-800">
          <p className="font-bold text-[#064E3B] text-xs mb-1">Mama Titi</p>
          {s.story}
        </div>
      )}
      {step >= 3 && (
        <div className="lp-pop ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-[#FFE8DE] px-3 py-2 font-semibold text-slate-800">{s.answer}</div>
      )}
      {step >= 4 && (
        <div className="lp-pop max-w-[90%] rounded-2xl rounded-tl-md bg-[#15803D] text-white px-3 py-2 font-bold">Ehhh! You got it! 🎉</div>
      )}
    </div>
  );
};

// Shown in the hero until a real photo is uploaded.
const ChatMockup: React.FC = () => (
  <div className="relative mx-auto w-full max-w-xs">
    <div className="rounded-[36px] bg-slate-900 p-3 shadow-2xl">
      <div className="rounded-[28px] bg-[#FFFBF5] p-4 min-h-[380px]">
        <StoryChat />
      </div>
    </div>
    <Emoji3D emoji="🪙" className="lp-float absolute -right-6 top-10 w-14 h-14" />
    <Emoji3D emoji="⭐" className="lp-float2 absolute -left-7 top-32 w-12 h-12" />
    <Emoji3D emoji="📚" className="lp-float absolute -right-5 bottom-14 w-12 h-12" />
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning, onLogIn, onSignUp }) => {
  useFunFonts();
  const [photoMissing, setPhotoMissing] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-slate-800 font-['Nunito']">
      <style>{STYLES}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FFF8EC]/95 backdrop-blur border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${FUN} w-10 h-10 rounded-2xl bg-[#15803D] text-white text-2xl font-bold flex items-center justify-center border-b-4 border-[#064E3B]`}>F</div>
            <span className={`${FUN} text-xl sm:text-2xl font-bold text-slate-900`}>Funly<span className="text-[#16A34A]">Learn</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogIn || onStartLearning} className="font-bold text-slate-700 px-2 sm:px-3 py-2 hover:text-slate-900">Log in</button>
            <button
              onClick={onSignUp || onStartLearning}
              className={`${FUN} ${PRESS} px-4 py-2.5 rounded-2xl bg-[#15803D] text-white font-bold border-b-4 border-[#064E3B]`}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-60" style={ANKARA_DOTS} />
        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-14 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left space-y-5">
            <div className="flex justify-center md:justify-start">
              <MovingGreeting />
            </div>
            <h1 className={`${FUN} text-5xl sm:text-6xl font-bold leading-[1.05] text-slate-900`}>
              Homework made easy, <span className="text-[#15803D]">the Naija way</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 font-semibold max-w-xl mx-auto md:mx-0">
              Mama Titi helps with your homework, then turns it into <b className="text-slate-800">your own notes, quizzes and games</b>.
            </p>
            <div className="flex flex-col items-center md:items-start gap-3">
              <button
                onClick={onStartLearning}
                className={`${FUN} ${PRESS} w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B]`}
              >
                Start 7 days free ▶
              </button>
              <p className={`${FUN} inline-flex items-center gap-2 font-semibold text-[#7E22CE]`}>
                <Emoji3D emoji="🎮" className="lp-wiggle w-8 h-8" />
                Psst… a secret Game Zone is hiding inside. Can you unlock it?
              </p>
            </div>
            <p className="text-[15px] font-bold text-slate-600">No debit card needed · Follows the NERDC curriculum, Primary 3 to SS3</p>
          </div>

          <div className="relative">
            {photoMissing ? (
              <ChatMockup />
            ) : (
              <>
                <img
                  src={HERO_PHOTO}
                  alt="A Nigerian child smiling while doing homework on a phone"
                  onError={() => setPhotoMissing(true)}
                  className="w-full aspect-[4/5] object-cover rounded-[32px] border-4 border-white shadow-2xl"
                />
                <div className="relative -mt-24 mx-3 sm:mx-6 md:absolute md:mt-0 md:mx-0 md:-left-10 md:bottom-6 md:w-80 rounded-3xl bg-white/95 backdrop-blur shadow-2xl border-2 border-emerald-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={mamaTitiMain} alt="Mama Titi" className="w-9 h-9 rounded-full object-cover object-top border-2 border-[#FFC83D]" />
                    <p className={`${FUN} font-bold text-[#064E3B] leading-tight`}>Mama Titi <span className="text-xs font-bold text-slate-500 font-['Nunito']">· AI teacher</span></p>
                  </div>
                  <div className="min-h-[220px]">
                    <StoryChat compact />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="h-3" style={ANKARA} />
      </section>

      {/* Made from your child's own homework */}
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-2">
          <h2 className={`${FUN} text-4xl font-bold text-slate-900`}>Made from your homework</h2>
          <p className="text-lg font-semibold text-slate-600">Every question you ask Mama Titi becomes a note in Create Notebook.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Revision notebook */}
          <div className="rounded-[28px] bg-[#DCFCE7] border-b-[6px] border-[#15803D] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Emoji3D emoji="📒" className="w-14 h-14 shrink-0" />
              <p className={`${FUN} text-2xl font-bold text-slate-900 leading-tight`}>Your own notebook</p>
            </div>
            <p className="font-semibold text-slate-700">
              Revise from your notes before tests. Hard topics come back each week until you get them right.
            </p>
          </div>

          {/* Homework games */}
          <div className="rounded-[28px] bg-[#2E1065] text-white border-b-[6px] border-black/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Emoji3D emoji="🎮" className="w-14 h-14 shrink-0" />
              <p className={`${FUN} text-2xl font-bold leading-tight`}>Games made just for you</p>
            </div>
            <p className="font-semibold text-purple-100">
              Play games with questions from what you learnt this week, with music, coins and confetti. Topics you're still learning come up more, so you get better while you play.
            </p>
            <div className="rounded-2xl bg-white/10 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-xs font-bold">💪 From Tuesday's homework</span>
                <span className={`${FUN} text-[#FFC83D] font-bold`}>+10 🪙</span>
              </div>
              <p className={`${FUN} font-semibold`}>Which fraction is equal to 1/2?</p>
              <div className="grid grid-cols-2 gap-2">
                <span className="rounded-xl bg-[#0284C7] px-3 py-1.5 font-bold">2/3</span>
                <span className="rounded-xl bg-[#15803D] px-3 py-1.5 font-bold ring-2 ring-[#FFC83D]">2/4 ✅</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-[28px] bg-[#FFF4D1] border-b-[6px] border-[#E0A800] p-5 space-y-2">
            <Emoji3D emoji="📸" className="w-12 h-12" />
            <p className={`${FUN} text-xl font-bold text-slate-900`}>Snap any question</p>
            <p className="font-semibold text-slate-600">Explained step by step, with stories about markets, Naira and jollof.</p>
          </div>
          <div className="rounded-[28px] bg-[#E0F4FF] border-b-[6px] border-[#38BDF8] p-5 space-y-2">
            <Emoji3D emoji="🎓" className="w-12 h-12" />
            <p className={`${FUN} text-xl font-bold text-slate-900`}>Exam practice</p>
            <p className="font-semibold text-slate-600">Practise for Common Entrance, BECE and WAEC. After each question, Mama Titi shows you the right answer and why.</p>
          </div>
        </div>
      </section>

      {/* Parents */}
      <section className="bg-[#064E3B] text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center space-y-4">
          <p className={`${FUN} text-[#FFC83D] font-bold text-lg`}>For parents</p>
          <h2 className={`${FUN} text-4xl font-bold leading-tight`}>See how your child is doing</h2>
          <p className="text-lg font-semibold text-emerald-100">Get results on WhatsApp and a report for each subject, every week.</p>
          <div className="max-w-sm w-full rounded-3xl bg-[#E5DDD5] p-3 text-left">
            <div className="rounded-2xl rounded-tr-md bg-[#DCF8C6] text-slate-800 px-3 py-2 text-sm leading-relaxed">
              🏆 <b>Weekly Challenge: 9 / 10</b><br />
              🚀 Improved: Equivalent Fractions<br />
              💪 Practising: Nouns and Pronouns
            </div>
          </div>
        </div>
      </section>

      {/* Final nudge */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className={`${FUN} text-4xl font-bold text-slate-900`}>Ready to try it?</h2>
        <button
          onClick={onSignUp || onStartLearning}
          className={`${FUN} ${PRESS} px-8 py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B]`}
        >
          Create a free account ▶
        </button>
      </section>

      <footer className="bg-[#064E3B] text-emerald-100 py-6 text-center text-sm font-semibold" style={ANKARA_DOTS}>
        <p className={`${FUN} text-xl font-bold text-white`}>Funly<span className="text-[#FFC83D]">Learn</span> 🇳🇬</p>
        <p>Made in Nigeria, for Nigerian children</p>
      </footer>
    </div>
  );
};
