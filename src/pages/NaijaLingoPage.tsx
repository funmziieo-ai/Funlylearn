import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { NAIJA_LINGO_WORDS, LINGO_QUIZZES } from '../data/naijaLingoData';
import { SyncedReadAlong } from '../components/SyncedReadAlong';
import { fetchAudioTTS } from '../services/apiClient';
import { fetchHomeworkRecords, getClassNotesForSession, getWeeklyTest } from '../services/supabaseService';
import { LINGO_LEVELS, getNextLockedLevel, getCoinsToNextLevel } from '../utils/coinsSystem';
import { gameAudio } from '../utils/gameAudio';

interface NaijaLingoPageProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenWordCrushPreview?: () => void;
  // Needed for the Homework Game (the child's own homework topics).
  userId?: string;
}

// ---------- design tokens (same fun style as the notebook) ----------
const FUN = "font-['Fredoka']";
const READ = "font-['Nunito']";
const PRESS = 'transition-transform active:translate-y-[4px]';
const STARRY: React.CSSProperties = {
  backgroundColor: '#2E1065',
  backgroundImage: [
    'radial-gradient(circle at 15% 8%, rgba(255,200,61,.20), transparent 35%)',
    'radial-gradient(circle at 90% 30%, rgba(56,189,248,.16), transparent 35%)',
    'radial-gradient(circle at 50% 95%, rgba(22,163,74,.20), transparent 40%)',
    'radial-gradient(rgba(255,255,255,.08) 1.5px, transparent 1.5px)'
  ].join(','),
  backgroundSize: 'auto, auto, auto, 26px 26px'
};
const TILE_COLORS = [
  'bg-[#16A34A] border-[#064E3B]',
  'bg-[#0284C7] border-[#075985]',
  'bg-[#7E22CE] border-[#4C1D95]',
  'bg-[#FF6B35] border-[#D9480F]'
];
const MAP_OFFSETS = [0, 60, 90, 60, 0, -60, -90, -60];
const QUESTIONS_PER_GAME = 8;
const SECONDS_PER_QUESTION = 12;
// Homework questions are longer to read, so they get more time.
const SECONDS_PER_HOMEWORK_QUESTION = 20;

const LEVEL_STARTER_WORD_IDS = ['l1', 'l4', 'l5', 'l8'];

const LEVEL_CATEGORY_MAP: Record<number, string[]> = {
  1: [],
  2: ['Greetings'],
  3: ['Food'],
  4: ['Family'],
  5: ['School'],
  6: [],
  7: ['Numbers'],
  8: ['Wisdom'],
};

const WORD_CRUSH_UNLOCK_COINS = 50;

function getWordsForLevel(levelId: number) {
  if (levelId === 1) {
    return NAIJA_LINGO_WORDS.filter(w => LEVEL_STARTER_WORD_IDS.includes(w.id));
  }
  const categories = LEVEL_CATEGORY_MAP[levelId] || [];
  return NAIJA_LINGO_WORDS.filter(w => categories.includes(w.category));
}

function getQuizzesForLevel(levelId: number) {
  const levelWords = getWordsForLevel(levelId).map(w => w.word);
  return LINGO_QUIZZES.filter(q => levelWords.includes(q.word));
}

type LingoQuiz = typeof LINGO_QUIZZES[number];

function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

// One question in any game. Lingo questions show a Yorùbá word and
// say it aloud; Homework Game questions show an English question.
interface GameQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerText: string;
  speak?: string;
  topic?: string;
  needsPractice?: boolean;
}

type GameMode = 'lingo' | 'homework';

function lingoToQuestion(q: LingoQuiz): GameQuestion {
  return {
    id: q.id,
    prompt: q.word,
    options: q.options,
    correctIndex: Math.max(0, q.options.indexOf(q.correctAnswer)),
    explanation: q.explanation,
    answerText: q.correctAnswer,
    speak: q.word
  };
}

// ---------- Homework Game (English) ----------
// The child's real topics from the last 2 weeks of notebook pages.
interface HomeworkTopic {
  subject: string;
  topic: string;
  needsPractice: boolean;
}

async function loadHomeworkTopics(userId: string, classLevel: string, language: string): Promise<HomeworkTopic[]> {
  const records = await fetchHomeworkRecords(userId, 80);
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const latestBySession = new Map<string, number>();
  records.forEach(r => {
    const time = new Date(r.createdAt).getTime();
    if (time < cutoff) return;
    const key = r.sessionId || `single-${r.id}`;
    latestBySession.set(key, Math.max(latestBySession.get(key) || 0, time));
  });
  const sessionIds = Array.from(latestBySession.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const outcomes = await Promise.all(sessionIds.map(id => getClassNotesForSession(id, classLevel, language)));
  const seen = new Set<string>();
  const topics: HomeworkTopic[] = [];
  outcomes.forEach(o => {
    if (o.kind !== 'ready') return;
    const key = o.notes.cleanTopic.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    topics.push({
      subject: o.notes.subject || 'General',
      topic: o.notes.cleanTopic,
      needsPractice: o.notes.status === 'needs_help'
    });
  });
  // Topics still being practised first.
  return topics.sort((a, b) => Number(b.needsPractice) - Number(a.needsPractice));
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

// ---------- Mama Titi's voice ----------
// Plays a Yorùbá word in the Idera voice, with the game music turned
// down while she speaks. Only one word plays at a time.
let currentVoice: HTMLAudioElement | null = null;

async function speakYoruba(text: string): Promise<boolean> {
  if (currentVoice) {
    currentVoice.pause();
    currentVoice = null;
  }
  try {
    const res = await fetchAudioTTS(text, 'yo');
    if (!res.audioUrl) return false;
    const audio = new Audio(res.audioUrl);
    currentVoice = audio;
    gameAudio.duck();
    const finish = () => {
      gameAudio.unduck();
      if (currentVoice === audio) currentVoice = null;
    };
    audio.onended = finish;
    audio.onerror = finish;
    await audio.play();
    return true;
  } catch (_e) {
    gameAudio.unduck();
    return false;
  }
}

function stopVoice() {
  if (currentVoice) {
    currentVoice.pause();
    currentVoice = null;
  }
  gameAudio.unduck();
}

const ListenButton: React.FC<{ text: string; label?: string; big?: boolean }> = ({ text, label = 'Listen', big = false }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.sfx('tap');
    setState('loading');
    const ok = await speakYoruba(text);
    setState(ok ? 'idle' : 'error');
  };

  if (big) {
    return (
      <button
        onClick={handle}
        aria-label={`Listen to ${text}`}
        className={`${PRESS} w-20 h-20 rounded-3xl bg-[#38BDF8] border-b-[6px] border-[#0284C7] text-4xl flex items-center justify-center`}
      >
        {state === 'loading' ? <span className="animate-spin">⏳</span> : state === 'error' ? '🔁' : '🔊'}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      className={`${PRESS} ${READ} inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-extrabold border-b-[3px] ${
        state === 'error'
          ? 'bg-rose-100 text-rose-700 border-rose-300'
          : 'bg-[#E0F4FF] text-[#0284C7] border-[#38BDF8]'
      }`}
    >
      {state === 'loading' ? '⏳' : state === 'error' ? '🔁 Try again' : `🔊 ${label}`}
    </button>
  );
};

type View = 'hub' | 'cards' | 'quiz' | 'results';

export const NaijaLingoPage: React.FC<NaijaLingoPageProps> = ({
  profile,
  onProfileUpdate,
  onOpenWordCrushPreview,
  userId
}) => {
  useFunFonts();

  // Timers below always read the newest profile, never a stale one.
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [view, setView] = useState<View>('hub');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [needsTap, setNeedsTap] = useState(false);
  const [musicOn, setMusicOn] = useState(gameAudio.isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(gameAudio.isSfxEnabled());
  const [toast, setToast] = useState<string | null>(null);
  const [homeworkTopics, setHomeworkTopics] = useState<HomeworkTopic[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setHomeworkTopics([]);
      return;
    }
    let cancelled = false;
    loadHomeworkTopics(userId, profile.classLevel, profile.language)
      .then(topics => { if (!cancelled) setHomeworkTopics(topics); })
      .catch(() => { if (!cancelled) setHomeworkTopics([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  const userCoins = profile.coins || 0;
  const isWordCrushUnlocked = userCoins >= WORD_CRUSH_UNLOCK_COINS;
  const nextLockedLevel = getNextLockedLevel(userCoins);
  const coinsToNext = getCoinsToNextLevel(userCoins);
  const currentLevel = LINGO_LEVELS.find(l => l.id === selectedLevel) || LINGO_LEVELS[0];
  const levelWords = getWordsForLevel(selectedLevel);

  // The highest level the child has unlocked that has words in it.
  const playableLevels = LINGO_LEVELS.filter(l => userCoins >= l.coinsRequired && getWordsForLevel(l.id).length > 0);
  const continueLevel = playableLevels[playableLevels.length - 1] || LINGO_LEVELS[0];

  // ---------- music: starts as soon as the page opens ----------
  useEffect(() => {
    let cancelled = false;
    gameAudio.unlock().then(ok => {
      if (cancelled) return;
      if (ok) gameAudio.playMusic('hub');
      else setNeedsTap(true);
    });
    const unsubscribe = gameAudio.subscribe(() => {
      setMusicOn(gameAudio.isMusicEnabled());
      setSfxOn(gameAudio.isSfxEnabled());
    });
    const onVisibility = () => {
      if (document.hidden) gameAudio.pauseMusic();
      else gameAudio.resumeMusic();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
      stopVoice();
      gameAudio.stopMusic();
    };
  }, []);

  useEffect(() => {
    if (needsTap) return;
    gameAudio.playMusic(view === 'quiz' ? 'game' : 'hub');
  }, [view, needsTap]);

  const handleTapToPlay = async () => {
    const ok = await gameAudio.unlock();
    if (!ok) return;
    setNeedsTap(false);
    gameAudio.sfx('go');
  };

  // If the browser is still waiting for a tap before allowing sound,
  // the very first tap anywhere on the page starts the music.
  useEffect(() => {
    if (!needsTap) return;
    const onFirstTap = () => { handleTapToPlay(); };
    document.addEventListener('pointerdown', onFirstTap, { once: true, capture: true });
    document.addEventListener('keydown', onFirstTap, { once: true, capture: true });
    return () => {
      document.removeEventListener('pointerdown', onFirstTap, { capture: true });
      document.removeEventListener('keydown', onFirstTap, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTap]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2400);
  };

  const handleShareOnWhatsApp = (scoreText?: string) => {
    const shareText = scoreText
      ? `${scoreText} Can you beat me? 😎 Play Naija Lingo on FunlyLearn: ${window.location.origin}`
      : `I'm learning Yorùbá with Mama Titi on FunlyLearn's Naija Lingo! 🥁 Come and play: ${window.location.origin}`;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText), '_blank');
  };

  const openLevel = (levelId: number) => {
    gameAudio.sfx('whoosh');
    setSelectedLevel(levelId);
    setView('cards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------- Quiz Battle ----------
  const [rounds, setRounds] = useState<GameQuestion[]>([]);
  const [mode, setMode] = useState<GameMode>('lingo');
  const [gameLoading, setGameLoading] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [correctCount, setCorrectCount] = useState(0);
  const [coinsWon, setCoinsWon] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [floatText, setFloatText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const answeredRef = useRef(false);
  // Refs hold the live game numbers, so timers never see stale values
  // and nothing (like coins) can be counted twice.
  const roundsRef = useRef<GameQuestion[]>([]);
  const modeRef = useRef<GameMode>('lingo');
  const streakRef = useRef(0);
  const correctRef = useRef(0);

  const clearGameTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
    countdownRefs.current.forEach(clearTimeout);
    timerRef.current = null;
    advanceRef.current = null;
    countdownRefs.current = [];
  };

  useEffect(() => clearGameTimers, []);

  const resetGame = (gameMode: GameMode) => {
    clearGameTimers();
    stopVoice();
    modeRef.current = gameMode;
    setMode(gameMode);
    streakRef.current = 0;
    correctRef.current = 0;
    setQi(0);
    setPicked(null);
    setTimedOut(false);
    setCorrectCount(0);
    setCoinsWon(0);
    setStreak(0);
    setBestStreak(0);
    setGameError(null);
  };

  const launch = (questions: GameQuestion[]) => {
    roundsRef.current = questions;
    setRounds(questions);
    const steps = ['3', '2', '1', modeRef.current === 'homework' ? 'Go!' : 'Bẹ̀rẹ̀!'];
    steps.forEach((step, i) => {
      countdownRefs.current.push(setTimeout(() => {
        setCountdown(step);
        gameAudio.sfx(i < 3 ? 'count' : 'go');
      }, i * 700));
    });
    countdownRefs.current.push(setTimeout(() => {
      setCountdown(null);
      beginQuestion(0);
    }, steps.length * 700 + 150));
  };

  const startQuiz = (levelId: number) => {
    const pool = getQuizzesForLevel(levelId);
    if (pool.length === 0) {
      showToast('A game for this level is coming soon!');
      return;
    }
    resetGame('lingo');
    setSelectedLevel(levelId);
    setView('quiz');
    window.scrollTo({ top: 0 });
    launch(shuffle(pool).slice(0, QUESTIONS_PER_GAME).map(lingoToQuestion));
  };

  const startHomework = async () => {
    if (!userId || !homeworkTopics || homeworkTopics.length === 0) {
      showToast('Do your homework with Mama Titi to unlock your Homework Game! 🎒');
      return;
    }
    resetGame('homework');
    setView('quiz');
    setGameLoading(true);
    window.scrollTo({ top: 0 });
    const questions = await getWeeklyTest(userId, profile.classLevel, profile.language, homeworkTopics.slice(0, 8), { variant: 'game' });
    setGameLoading(false);
    if (modeRef.current !== 'homework') return; // child left while it loaded
    if (!questions || questions.length === 0) {
      setGameError("Your Homework Game didn't load. Check your internet and try again.");
      return;
    }
    launch(shuffle(questions).slice(0, QUESTIONS_PER_GAME).map(q => ({
      id: q.id,
      prompt: q.question,
      options: q.options,
      correctIndex: q.correctOptionIndex,
      explanation: q.explanation,
      answerText: q.options[q.correctOptionIndex],
      topic: q.topic,
      needsPractice: q.needsPractice
    })));
  };

  const playAgain = () => {
    if (mode === 'homework') startHomework();
    else startQuiz(selectedLevel);
  };

  const beginQuestion = (index: number) => {
    answeredRef.current = false;
    setQi(index);
    setPicked(null);
    setTimedOut(false);
    const seconds = modeRef.current === 'homework' ? SECONDS_PER_HOMEWORK_QUESTION : SECONDS_PER_QUESTION;
    setTimeLeft(seconds);
    const start = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, seconds - (Date.now() - start) / 1000);
      setTimeLeft(left);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAnswer(null, index);
      }
    }, 100);
    // Mama Titi says the word automatically.
    advanceRef.current = setTimeout(() => {
      const q = roundsRef.current[index];
      if (q?.speak) speakYoruba(q.speak);
    }, 350);
  };

  const handleAnswer = (optionIndex: number | null, index: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const q = roundsRef.current[index];
    if (!q) return;
    const right = optionIndex !== null && optionIndex === q.correctIndex;
    setPicked(optionIndex === null ? null : q.options[optionIndex]);
    setTimedOut(optionIndex === null);

    const p = profileRef.current;
    if (right) {
      const newStreak = (p.correctStreak || 0) + 1;
      const streakBonus = newStreak % 3 === 0 ? 20 : 0;
      const gained = 10 + streakBonus;
      onProfileUpdate({
        ...p,
        stars: p.stars + 20,
        coins: (p.coins || 0) + gained,
        correctStreak: newStreak
      });
      correctRef.current += 1;
      streakRef.current += 1;
      setCorrectCount(correctRef.current);
      setCoinsWon(c => c + gained);
      setStreak(streakRef.current);
      setBestStreak(b => Math.max(b, streakRef.current));
      if (streakRef.current === 3) gameAudio.sfx('combo');
      setFloatText(`+${gained} 🪙`);
      setTimeout(() => setFloatText(null), 900);
      gameAudio.sfx('correct');
      gameAudio.sfx('coin');
    } else {
      onProfileUpdate({ ...p, correctStreak: 0 });
      streakRef.current = 0;
      setStreak(0);
      gameAudio.sfx('wrong');
    }

    // Moves on by itself. A little longer after a miss, so there's
    // time to read the explanation.
    advanceRef.current = setTimeout(() => goNext(index), right ? 2000 : 2800);
  };

  const goNext = (index: number) => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = null;
    if (index + 1 < roundsRef.current.length) {
      beginQuestion(index + 1);
    } else {
      finishQuiz(roundsRef.current.length);
    }
  };

  const finishQuiz = (total: number) => {
    clearGameTimers();
    stopVoice();
    setView('results');
    window.scrollTo({ top: 0 });
    // Confetti and the fanfare only for a perfect game.
    if (total > 0 && correctRef.current === total) {
      gameAudio.sfx('win');
      const base = { spread: 80, zIndex: 9999, colors: ['#16A34A', '#FFC83D', '#FF6B35', '#38BDF8', '#A855F7'] };
      confetti({ ...base, particleCount: 150, origin: { y: 0.6 } });
      setTimeout(() => confetti({ ...base, particleCount: 80, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
      setTimeout(() => confetti({ ...base, particleCount: 80, angle: 120, origin: { x: 1, y: 0.7 } }), 450);
    }
  };

  const leaveQuiz = () => {
    modeRef.current = 'lingo';
    setGameLoading(false);
    clearGameTimers();
    stopVoice();
    setCountdown(null);
    setView('hub');
  };

  const quiz = rounds[qi];
  const answered = picked !== null || timedOut;
  const wasRight = !!quiz && picked === quiz.options[quiz.correctIndex];
  const questionSeconds = mode === 'homework' ? SECONDS_PER_HOMEWORK_QUESTION : SECONDS_PER_QUESTION;

  // ---------- shared pieces ----------
  const SoundToggles = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => gameAudio.setMusicEnabled(!musicOn)}
        aria-label={musicOn ? 'Turn music off' : 'Turn music on'}
        className={`${PRESS} px-3 py-1.5 rounded-full font-extrabold text-sm ${musicOn ? 'bg-white/20' : 'bg-white/5 text-white/50'}`}
      >
        🎵 {musicOn ? 'On' : 'Off'}
      </button>
      <button
        onClick={() => gameAudio.setSfxEnabled(!sfxOn)}
        aria-label={sfxOn ? 'Turn sound effects off' : 'Turn sound effects on'}
        className={`${PRESS} px-3 py-1.5 rounded-full font-extrabold text-sm ${sfxOn ? 'bg-white/20' : 'bg-white/5 text-white/50'}`}
      >
        🔊 {sfxOn ? 'On' : 'Off'}
      </button>
    </div>
  );

  return (
    <div className={`max-w-2xl mx-auto p-3 sm:p-6 pb-28 ${READ}`}>
      <div className="relative rounded-[32px] overflow-hidden text-white text-[17px] p-4 sm:p-6 space-y-5 min-h-[80vh]" style={STARRY}>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#FF6B35] font-extrabold text-sm">🔥 {profile.streakDays}</span>
            <span className="px-3 py-1.5 rounded-full bg-[#FFC83D] text-[#064E3B] font-extrabold text-sm">🪙 {userCoins}</span>
          </div>
          {SoundToggles}
        </div>

        {/* ================= GAME ZONE (hub) ================= */}
        {view === 'hub' && (
          <div className="space-y-6">
            <div className="text-center pt-1">
              <p className={`${FUN} text-5xl font-bold tracking-tight`}>
                Game Zone <span className="inline-block animate-bounce">🎮</span>
              </p>
              <p className="text-white/70 font-semibold mt-1">Play, learn and win coins, {profile.name}!</p>
            </div>

            {/* 1. Homework Game (English): the main attraction */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#FFC83D] via-[#FFA94D] to-[#FF6B35] p-5 text-[#2E1065] border-b-[8px] border-[#D9480F] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`${FUN} inline-block px-3 py-1 rounded-full bg-[#2E1065] text-[#FFC83D] text-sm font-bold`}>1 · From your homework</span>
                  <p className={`${FUN} text-3xl font-bold mt-2 leading-tight`}>Homework Game 🎒</p>
                  <p className="font-bold opacity-80">
                    {homeworkTopics === null
                      ? 'Checking your homework...'
                      : homeworkTopics.length === 0
                      ? 'Do your homework with Mama Titi to unlock this game!'
                      : `${homeworkTopics.length} ${homeworkTopics.length === 1 ? 'topic' : 'topics'} you learned with Mama Titi${
                          homeworkTopics.some(t => t.needsPractice)
                            ? ` · ${homeworkTopics.filter(t => t.needsPractice).length} to practise 💪`
                            : ''
                        }`}
                  </p>
                </div>
                <span className="text-6xl animate-bounce shrink-0">🏆</span>
              </div>

              {homeworkTopics && homeworkTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {homeworkTopics.slice(0, 3).map(t => (
                    <span key={t.topic} className="px-3 py-1.5 rounded-full bg-white/70 font-extrabold text-sm">
                      {t.needsPractice ? '💪' : '📘'} {t.topic}
                    </span>
                  ))}
                  {homeworkTopics.length > 3 && (
                    <span className="px-3 py-1.5 rounded-full bg-white/40 font-extrabold text-sm">+{homeworkTopics.length - 3} more</span>
                  )}
                </div>
              )}

              <button
                onClick={startHomework}
                className={`${PRESS} ${FUN} w-full py-4 rounded-2xl text-2xl font-bold border-b-[6px] ${
                  homeworkTopics && homeworkTopics.length > 0
                    ? 'bg-[#2E1065] text-[#FFC83D] border-black/40'
                    : 'bg-[#2E1065]/40 text-white/80 border-black/20'
                }`}
              >
                {homeworkTopics && homeworkTopics.length > 0 ? '▶ Play' : '🔒 Locked'}
              </button>
            </div>

            {/* 2. Naija Lingo (Yorùbá) */}
            <div className="rounded-[28px] bg-white/10 border-2 border-white/15 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className={`${FUN} inline-block px-3 py-1 rounded-full bg-[#7E22CE] text-white text-sm font-bold`}>2 · Learn Yorùbá</span>
                  <p className={`${FUN} text-3xl font-bold mt-2`}>Naija Lingo 🥁</p>
                </div>
                <button
                  onClick={() => {
                    gameAudio.sfx('whoosh');
                    document.getElementById('lingo-journey')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`${PRESS} ${FUN} shrink-0 px-4 py-2.5 rounded-2xl bg-white/15 font-semibold`}
                >
                  🗺️ Journey
                </button>
              </div>

              <button
                onClick={() => startQuiz(continueLevel.id)}
                className={`${PRESS} w-full flex items-center gap-4 rounded-3xl bg-[#16A34A] border-b-[6px] border-[#064E3B] px-4 py-3 text-left`}
              >
                <span className="w-14 h-14 rounded-2xl bg-white/20 text-3xl flex items-center justify-center shrink-0">{continueLevel.emoji}</span>
                <span className="flex-1">
                  <span className={`${FUN} block text-2xl font-bold`}>▶ Quiz Battle</span>
                  <span className="block text-white/85 font-semibold text-sm">Level {continueLevel.id}: {continueLevel.name}</span>
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openLevel(continueLevel.id)}
                  className={`${PRESS} text-left rounded-3xl p-4 bg-[#0284C7] border-b-[6px] border-[#075985]`}
                >
                  <span className="text-3xl block">🃏</span>
                  <span className={`${FUN} block text-lg font-bold mt-1`}>Word Cards</span>
                  <span className="block text-xs text-white/85 font-semibold">Learn and listen</span>
                </button>
                <button
                  onClick={() => {
                    if (isWordCrushUnlocked) {
                      gameAudio.sfx('whoosh');
                      onOpenWordCrushPreview?.();
                    } else {
                      gameAudio.sfx('wrong');
                      showToast(`Win ${WORD_CRUSH_UNLOCK_COINS - userCoins} more 🪙 to unlock Word Crush!`);
                    }
                  }}
                  className={`${PRESS} text-left rounded-3xl p-4 border-b-[6px] ${
                    isWordCrushUnlocked ? 'bg-[#FF6B35] border-[#D9480F]' : 'bg-white/10 border-white/10'
                  }`}
                >
                  <span className="text-3xl block">{isWordCrushUnlocked ? '🍬' : '🔒'}</span>
                  <span className={`${FUN} block text-lg font-bold mt-1`}>Word Crush</span>
                  <span className="block text-xs text-white/85 font-semibold">
                    {isWordCrushUnlocked ? 'Match and build words' : `${WORD_CRUSH_UNLOCK_COINS} coins to unlock`}
                  </span>
                </button>
              </div>

              {nextLockedLevel && (
                <div className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm font-bold">
                    <span>Next: {nextLockedLevel.emoji} {nextLockedLevel.name}</span>
                    <span className="text-[#FFC83D]">{coinsToNext} 🪙 to go</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#FFC83D]"
                      style={{ width: `${Math.min(100, Math.round((userCoins / nextLockedLevel.coinsRequired) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Journey map, coin rules and invite, at the bottom like a game menu */}
            <div id="lingo-journey" className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 space-y-1 scroll-mt-4">
              <p className={`${FUN} text-2xl font-bold text-center`}>Your journey 🗺️</p>
              <p className="text-center text-white/60 text-sm font-semibold pb-3">Win coins to unlock new places</p>
            <div className="flex flex-col items-center gap-5 py-2">
              {LINGO_LEVELS.map((level, i) => {
                const unlocked = userCoins >= level.coinsRequired;
                const hasContent = getWordsForLevel(level.id).length > 0;
                const isCurrent = level.id === continueLevel.id;
                const look = !unlocked
                  ? 'bg-white/10 border-white/10'
                  : isCurrent
                  ? 'bg-[#16A34A] border-[#064E3B] animate-bounce'
                  : 'bg-[#FFC83D] border-[#E0A800]';
                return (
                  <div
                    key={level.id}
                    className="flex flex-col items-center"
                    style={{ transform: `translateX(${MAP_OFFSETS[i % MAP_OFFSETS.length]}px)` }}
                  >
                    {isCurrent && (
                      <span className={`${FUN} text-xs font-bold px-3 py-1 rounded-full bg-white text-[#7E22CE] mb-1`}>YOU ARE HERE</span>
                    )}
                    <button
                      onClick={() => {
                        if (!unlocked) {
                          gameAudio.sfx('wrong');
                          showToast(`Win ${level.coinsRequired - userCoins} more 🪙 to unlock ${level.name}!`);
                        } else if (!hasContent) {
                          showToast(`${level.name} words are coming soon!`);
                        } else {
                          openLevel(level.id);
                        }
                      }}
                      aria-label={`Level ${level.id}: ${level.name}`}
                      className={`${PRESS} w-20 h-20 rounded-full border-b-[7px] text-4xl flex items-center justify-center ${look}`}
                    >
                      {unlocked ? level.emoji : '🔒'}
                    </button>
                    <span className={`${FUN} font-bold mt-1 ${unlocked ? '' : 'text-white/40'}`}>{level.name}</span>
                    <span className={`text-xs font-bold ${unlocked ? 'text-white/60' : 'text-white/35'}`}>
                      {!unlocked ? `${level.coinsRequired} 🪙 to unlock` : hasContent ? `Level ${level.id}` : 'Coming soon'}
                    </span>
                  </div>
                );
              })}
            </div>

            </div>

            <div className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 space-y-2">
              <p className={`${FUN} text-xl font-bold`}>How to win coins 🪙</p>
              <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
                <p className="rounded-2xl bg-white/10 px-3 py-2">✅ Right answer: +10</p>
                <p className="rounded-2xl bg-white/10 px-3 py-2">🔥 3 in a row: +20</p>
                <p className="rounded-2xl bg-white/10 px-3 py-2">📸 Snap homework: +5</p>
                <p className="rounded-2xl bg-white/10 px-3 py-2">💬 Mama Titi chat: +10</p>
              </div>
            </div>

            <button
              onClick={() => handleShareOnWhatsApp()}
              className={`${PRESS} ${FUN} w-full py-4 rounded-2xl bg-[#16A34A] text-xl font-semibold border-b-[6px] border-[#064E3B]`}
            >
              📲 Invite friends to play
            </button>
          </div>
        )}

        {/* ================= WORD CARDS ================= */}
        {view === 'cards' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('hub')}
                aria-label="Back to Game Zone"
                className={`${PRESS} w-11 h-11 rounded-full bg-white/15 font-bold shrink-0`}
              >
                ◀
              </button>
              <div>
                <p className="text-white/60 text-sm font-bold">Level {currentLevel.id}</p>
                <p className={`${FUN} text-2xl font-bold`}>{currentLevel.emoji} {currentLevel.name}</p>
              </div>
            </div>

            {levelWords.length === 0 ? (
              <div className="rounded-3xl bg-white/10 p-8 text-center space-y-2">
                <p className="text-5xl">🚧</p>
                <p className={`${FUN} text-xl font-bold`}>Words for this level are coming soon!</p>
              </div>
            ) : (
              <>
                {/* Word of the day */}
                <div className="rounded-3xl bg-white text-slate-800 p-5 space-y-3 border-b-[6px] border-slate-300">
                  <span className={`${FUN} inline-block px-3 py-1 rounded-full bg-[#FFC83D] text-[#064E3B] font-bold text-sm`}>⭐ Word of the day</span>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`${FUN} text-4xl font-bold text-[#7E22CE]`}>{levelWords[0].word}</p>
                      <p className="text-sm text-slate-500 italic">Say it: {levelWords[0].phonetic}</p>
                      <p className={`${FUN} text-xl font-semibold text-[#FF6B35]`}>"{levelWords[0].englishTranslation}"</p>
                    </div>
                    <ListenButton text={levelWords[0].word} big />
                  </div>
                  <SyncedReadAlong
                    text={levelWords[0].word + ' means ' + levelWords[0].englishTranslation + '. ' + levelWords[0].culturalNote}
                    language="yo"
                  />
                  <div className="rounded-2xl bg-[#FFF4D1] p-3">
                    <p className={`${FUN} font-semibold text-[#8A5A00]`}>🌍 Did you know?</p>
                    <p className="text-[16px]">{levelWords[0].culturalNote}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {levelWords.map((w, i) => (
                    <div key={w.id} className="rounded-3xl bg-white text-slate-800 p-4 space-y-2 border-b-[6px] border-slate-300">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`${FUN} text-2xl font-bold ${['text-[#16A34A]', 'text-[#0284C7]', 'text-[#7E22CE]', 'text-[#D9480F]'][i % 4]}`}>{w.word}</p>
                          <p className="font-extrabold text-slate-600">{w.englishTranslation}</p>
                        </div>
                        <span className="text-xs font-extrabold bg-[#F3E8FF] text-[#7E22CE] px-2 py-1 rounded-full shrink-0">{w.category}</span>
                      </div>
                      {w.sampleSentence && (
                        <p className="text-sm text-slate-500 italic">{w.sampleSentence}</p>
                      )}
                      <div className="flex gap-2 flex-wrap pt-1">
                        <ListenButton text={w.word} label="Word" />
                        {w.sampleSentence && <ListenButton text={w.sampleSentence} label="Sentence" />}
                      </div>
                    </div>
                  ))}
                </div>

                {getQuizzesForLevel(selectedLevel).length > 0 && (
                  <button
                    onClick={() => startQuiz(selectedLevel)}
                    className={`${PRESS} ${FUN} w-full py-4 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-xl font-bold border-b-[6px] border-[#E0A800]`}
                  >
                    ⚡ Play the {currentLevel.name} battle
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= GAME (Quiz Battle and Homework Game) ================= */}
        {view === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={leaveQuiz} aria-label="Leave game" className={`${PRESS} w-11 h-11 rounded-full bg-white/15 font-bold shrink-0`}>✕</button>
              <div className="flex-1 h-5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#FFC83D] transition-all"
                  style={{ width: `${rounds.length ? ((qi + (answered ? 1 : 0)) / rounds.length) * 100 : 0}%` }}
                />
              </div>
              <span className={`${FUN} px-3 py-1.5 rounded-full bg-[#FF6B35] font-bold transition-opacity ${streak >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                🔥 {streak}
              </span>
            </div>

            {gameLoading && (
              <div className="py-16 text-center space-y-3">
                <p className="text-6xl animate-bounce">🎒</p>
                <p className={`${FUN} text-2xl font-bold`}>Building your Homework Game...</p>
                <p className="text-white/70 font-semibold">Using what you learned with Mama Titi</p>
              </div>
            )}

            {gameError && (
              <div className="py-12 text-center space-y-3">
                <p className="text-5xl">😕</p>
                <p className="font-semibold text-white/90">{gameError}</p>
                <button
                  onClick={startHomework}
                  className={`${PRESS} ${FUN} px-6 py-3 rounded-2xl bg-[#FFC83D] text-[#064E3B] font-bold border-b-[5px] border-[#E0A800]`}
                >
                  🔄 Try again
                </button>
              </div>
            )}

            {quiz && !countdown && !gameLoading && !gameError && (
              <>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${timeLeft / questionSeconds > 0.5 ? 'bg-[#38BDF8]' : timeLeft / questionSeconds > 0.25 ? 'bg-[#FFC83D]' : 'bg-[#FF6B35]'}`}
                    style={{ width: `${(timeLeft / questionSeconds) * 100}%` }}
                  />
                </div>

                <p className={`${FUN} text-center text-white/70 font-semibold`}>
                  {mode === 'homework'
                    ? `🎒 Homework Game · Question ${qi + 1} of ${rounds.length}`
                    : `Question ${qi + 1} of ${rounds.length} · ${currentLevel.emoji} ${currentLevel.name}`}
                </p>

                {mode === 'homework' ? (
                  <div className="rounded-3xl bg-white/10 p-6 text-center space-y-3">
                    {quiz.topic && (
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-extrabold ${quiz.needsPractice ? 'bg-[#FF6B35]' : 'bg-white/15'}`}>
                        {quiz.needsPractice ? '💪 ' : '📘 '}{quiz.topic}
                      </span>
                    )}
                    <p className={`${FUN} text-2xl sm:text-3xl font-semibold leading-snug`}>{quiz.prompt}</p>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white/10 p-6 text-center space-y-3">
                    <p className="text-white/70 font-bold">What does this mean?</p>
                    <p className={`${FUN} text-4xl sm:text-5xl font-bold text-[#FFC83D]`}>{quiz.prompt}</p>
                    {quiz.speak && (
                      <div className="flex justify-center">
                        <ListenButton text={quiz.speak} big />
                      </div>
                    )}
                  </div>
                )}

                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quiz.options.map((opt, i) => {
                    const isRight = i === quiz.correctIndex;
                    const isPicked = picked === opt;
                    const after = answered
                      ? isRight
                        ? 'ring-4 ring-[#FFC83D]'
                        : isPicked
                        ? 'opacity-60'
                        : 'opacity-30'
                      : '';
                    return (
                      <button
                        key={`${quiz.id}-${i}`}
                        disabled={answered}
                        onClick={() => {
                          gameAudio.sfx('tap');
                          handleAnswer(i, qi);
                        }}
                        className={`${answered ? '' : PRESS} ${FUN} rounded-2xl p-4 font-semibold border-b-[6px] text-left ${
                          mode === 'homework' ? 'text-xl' : 'text-2xl'
                        } ${TILE_COLORS[i % 4]} ${after}`}
                      >
                        {opt} {answered && isRight ? '✅' : answered && isPicked ? '❌' : ''}
                      </button>
                    );
                  })}
                  {floatText && (
                    <span className={`${FUN} absolute left-1/2 -translate-x-1/2 -top-6 text-4xl font-bold text-[#FFC83D] animate-bounce pointer-events-none`}>
                      {floatText}
                    </span>
                  )}
                </div>

                {answered && (
                  <div className={`rounded-3xl p-4 text-center space-y-2 ${wasRight ? 'bg-[#16A34A]' : 'bg-[#FFC83D] text-[#064E3B]'}`}>
                    <p className={`${FUN} text-2xl font-bold`}>
                      {wasRight
                        ? mode === 'homework'
                          ? ['Correct! 🎉', 'Brilliant! ⭐', "You've got it! 🔥"][(qi + correctCount) % 3]
                          : ['Ó dára! 🎉', 'Ẹ kú iṣẹ́! ⭐', 'Ẹ̀wà! 🔥'][(qi + correctCount) % 3]
                        : timedOut
                        ? "⏰ Time's up!"
                        : mode === 'homework'
                        ? 'Nice try! Keep going 💪'
                        : 'Kò burú! Keep going 💪'}
                    </p>
                    {!wasRight && <p className="font-bold">The answer is: {quiz.answerText}</p>}
                    <p className="font-semibold">{quiz.explanation}</p>
                    <button
                      onClick={() => goNext(qi)}
                      className={`${PRESS} ${FUN} px-6 py-2.5 rounded-2xl font-semibold ${wasRight ? 'bg-white/20' : 'bg-white/60'}`}
                    >
                      {qi + 1 < rounds.length ? 'Next ▶' : 'See my score 🏆'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {view === 'results' && (() => {
          const total = rounds.length;
          const perfect = total > 0 && correctCount === total;
          const ratio = total ? correctCount / total : 0;
          const stars = Math.max(1, Math.round(ratio * 5));
          return (
            <div className="space-y-4 text-center">
              <p className="text-8xl pt-2">{perfect ? '🏆' : ratio >= 0.5 ? '🌟' : '💪'}</p>
              <p className={`${FUN} text-4xl font-bold text-[#FFC83D]`}>
                {perfect ? 'Ẹ kú iṣẹ́! Perfect!' : ratio >= 0.5 ? 'Ó dára! Well done!' : 'Kò burú! Nice try!'}
              </p>
              <p className="font-semibold text-white/80">
                {perfect
                  ? `You got every single one right, ${profile.name}!`
                  : mode === 'homework'
                  ? 'Play again to practise your homework topics 🎒'
                  : 'Play again to win more coins 🪙'}
              </p>
              <p className="text-4xl tracking-wider" aria-label={`${stars} out of 5 stars`}>
                {'⭐'.repeat(stars)}<span className="opacity-25">{'⭐'.repeat(5 - stars)}</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl">✅</p><p className={`${FUN} text-2xl font-bold`}>{correctCount}/{total}</p><p className="text-xs font-bold text-white/60">correct</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl">🪙</p><p className={`${FUN} text-2xl font-bold text-[#FFC83D]`}>+{coinsWon}</p><p className="text-xs font-bold text-white/60">coins</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl">🔥</p><p className={`${FUN} text-2xl font-bold text-[#FF6B35]`}>{bestStreak}</p><p className="text-xs font-bold text-white/60">best streak</p></div>
              </div>
              <div className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 text-left space-y-2">
                <p className={`${FUN} text-xl font-bold`}>{mode === 'homework' ? '🎒 Topics in this game' : '📚 Words in this game'}</p>
                <div className="flex flex-wrap gap-2">
                  {mode === 'homework'
                    ? Array.from(new Set(rounds.map(r => r.topic).filter(Boolean))).map(topic => (
                        <span key={topic} className="px-3 py-2 rounded-2xl bg-white/10 font-semibold">📘 {topic}</span>
                      ))
                    : rounds.map(r => (
                        <span key={r.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10">
                          <b className="text-[#FFC83D]">{r.prompt}</b>
                          <span className="text-white/80">{r.answerText}</span>
                          {r.speak && <ListenButton text={r.speak} label="" />}
                        </span>
                      ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={playAgain}
                  className={`${PRESS} ${FUN} py-4 rounded-2xl bg-[#FF6B35] text-xl font-bold border-b-[6px] border-[#D9480F]`}
                >
                  🔁 Play again
                </button>
                <button
                  onClick={() => setView('hub')}
                  className={`${PRESS} ${FUN} py-4 rounded-2xl bg-white text-[#7E22CE] text-xl font-bold border-b-[6px] border-slate-300`}
                >
                  🎮 Game Zone
                </button>
              </div>
              <button
                onClick={() => handleShareOnWhatsApp(
                  mode === 'homework'
                    ? `🎒 I scored ${correctCount}/${total} in my FunlyLearn Homework Game!`
                    : `🥁 I scored ${correctCount}/${total} in Naija Lingo ${currentLevel.name} on FunlyLearn!`
                )}
                className={`${PRESS} ${FUN} w-full py-4 rounded-2xl bg-[#16A34A] text-xl font-semibold border-b-[6px] border-[#064E3B]`}
              >
                📲 Challenge a friend
              </button>
            </div>
          );
        })()}

        {/* Countdown */}
        {countdown && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#2E1065]/90">
            <p key={countdown} className={`${FUN} text-8xl font-bold text-[#FFC83D] animate-bounce`}>{countdown}</p>
          </div>
        )}

        {/* Shown only while the browser waits for a first tap before allowing sound. */}
        {needsTap && (
          <button
            onClick={handleTapToPlay}
            className={`${PRESS} ${FUN} fixed top-3 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-[#FFC83D] text-[#064E3B] font-bold shadow-xl animate-pulse`}
          >
            🎵 Tap anywhere for music
          </button>
        )}

        {toast && (
          <div className={`${FUN} fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white text-[#7E22CE] font-semibold px-5 py-3 rounded-2xl shadow-xl`}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};
