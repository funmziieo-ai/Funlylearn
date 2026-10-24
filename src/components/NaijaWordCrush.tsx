import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WORD_CRUSH_VOCABULARY } from '../data/naijaWordCrushData';
import { fetchAudioTTS } from '../services/apiClient';
import { UserProfile } from '../types';
import { gameAudio } from '../utils/gameAudio';
import { Emoji3D } from './Emoji3D';
import { ShareSheet, ShareData, openNativeShare } from './ShareSheet';

export interface NaijaWordCrushProps {
  profile?: UserProfile;
  onBackToApp?: () => void;
  isStandalonePreview?: boolean;
  // Lets the games add the coins a child wins to their profile.
  onProfileUpdate?: (profile: UserProfile) => void;
}

// ---------- design tokens (same as the Game Zone) ----------
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
  'bg-[#FF6B35] border-[#D9480F]',
  'bg-[#E0A800] border-[#8A5A00]',
  'bg-[#DB2777] border-[#9D174D]'
];
const CONFETTI_COLORS = ['#FFC83D', '#FF6B35', '#16A34A', '#38BDF8', '#A855F7', '#E11D48', '#ffffff'];

// Candy looks for Letter Crush: colour plus shape, so children who see
// colours differently can still tell the candies apart.
const CANDY_LOOKS = [
  { bg: 'radial-gradient(circle at 30% 25%, #FF8FB1, #E11D48 60%, #9F1239)', shape: 'circle' },
  { bg: 'radial-gradient(circle at 30% 25%, #86EFAC, #16A34A 60%, #14532D)', shape: 'square' },
  { bg: 'radial-gradient(circle at 30% 25%, #7DD3FC, #0284C7 60%, #0C4A6E)', shape: 'diamond' },
  { bg: 'radial-gradient(circle at 30% 25%, #FDE68A, #F59E0B 60%, #92400E)', shape: 'circle' },
  { bg: 'radial-gradient(circle at 30% 25%, #D8B4FE, #9333EA 60%, #581C87)', shape: 'square' }
];
const PRAISE = ['Sweet! 🍬', 'Ẹ̀wà! ✨', 'Ó dára! 🎉', 'Jollof! 🔥', 'Super! ⭐', 'Ẹ kú iṣẹ́! 🏆'];

const N = 7;                 // Letter Crush board is 7 x 7
const WORDS_PER_ROUND = 10;
const MOVES_PER_WORD = 20;
const NEED_PER_LETTER = 10;  // tuned so a word takes about 6 moves
const CATCH_GOAL = 10;
const HINT_COST = 5;
const BEST_KEY = 'naija_word_crush_best_catch';

const STYLES = `
.wc-candy { position: absolute; width: calc(100% / ${N}); height: calc(100% / ${N}); padding: 4px; cursor: pointer;
  transition: top .24s cubic-bezier(.5,0,.75,1.4), left .22s ease, transform .2s ease, opacity .2s ease; touch-action: none; }
.wc-candy .shape { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: inset 0 -6px 0 rgba(0,0,0,.25), inset 0 5px 8px rgba(255,255,255,.55), 0 4px 8px rgba(0,0,0,.35); transition: transform .15s; }
.wc-candy .shape b { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: clamp(18px, 5.5vw, 32px); text-shadow: 0 2px 2px rgba(0,0,0,.4); }
.wc-candy .circle { border-radius: 50%; }
.wc-candy .square { border-radius: 30%; }
.wc-candy .diamond { border-radius: 22%; transform: rotate(45deg) scale(.8); }
.wc-candy .diamond b { transform: rotate(-45deg); }
.wc-candy.sel .shape { outline: 4px solid #FFC83D; outline-offset: 1px; transform: scale(1.12); }
.wc-candy.sel .diamond { transform: rotate(45deg) scale(.92); }
.wc-candy.boom { transform: scale(1.6); opacity: 0; }
.wc-candy.hint .shape { animation: wc-wiggle .5s ease-in-out 4; }
@keyframes wc-wiggle { 0%,100% { rotate: 0deg } 25% { rotate: -12deg } 75% { rotate: 12deg } }
.wc-praise { transform: translate(-50%, -50%); animation: wc-praise .9s ease-out forwards; text-shadow: 0 3px 0 #D9480F, 0 6px 12px rgba(0,0,0,.4); white-space: nowrap; }
@keyframes wc-praise { 0% { transform: translate(-50%, -20%) scale(.5); opacity: 0 } 25% { transform: translate(-50%, -50%) scale(1.15); opacity: 1 } 100% { transform: translate(-50%, -120%) scale(1); opacity: 0 } }
.wc-wobble { animation: wc-wobble .4s; }
@keyframes wc-wobble { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) rotate(-4deg) } 75% { transform: translateX(8px) rotate(4deg) } }
.wc-pop { animation: wc-pop .3s ease-out; }
@keyframes wc-pop { 0% { transform: scale(.6); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
.wc-bubble { position: absolute; transform: translateX(-50%); }
@media (prefers-reduced-motion: reduce) { .wc-candy, .wc-wobble, .wc-pop, .wc-praise { animation: none !important; transition: none !important; } }
`;

// ---------- words ----------
interface GameWord {
  id: string;
  word: string;
  en: string;
  emoji: string;
}

const WORDS: GameWord[] = WORD_CRUSH_VOCABULARY
  .filter(w => w.language === 'Yoruba')
  .map(w => ({ id: w.id, word: w.word, en: w.english, emoji: w.itemEmoji }));

// Yorùbá letters for spelling: keeps the dot under Ẹ, Ọ, Ṣ and the GB
// letter, and only leaves out the tone marks on top (the finished word
// is always shown with its full tone marks).
function lettersOf(word: string): string[] {
  const s = word.normalize('NFD').replace(/[\u0300\u0301\u0302\u0304]/g, '').normalize('NFC').toUpperCase();
  const out: string[] = [];
  for (let i = 0; i < s.length;) {
    if (/[\s\-/,.'’]/.test(s[i])) { i++; continue; }
    if (s.substr(i, 2) === 'GB') { out.push('GB'); i += 2; continue; }
    out.push(s[i]);
    i++;
  }
  return out;
}

function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

// Each word comes up once before any word repeats.
function makeDeck(list: GameWord[]) {
  let deck: GameWord[] = [];
  let last: GameWord | null = null;
  return (): GameWord => {
    if (deck.length === 0) {
      deck = shuffle(list);
      if (last && deck.length > 1 && deck[0].id === last.id) deck.push(deck.shift()!);
    }
    last = deck.shift()!;
    return last;
  };
}

const LC_WORDS = WORDS.filter(w => { const u = new Set(lettersOf(w.word)); return u.size >= 2 && u.size <= 5; });
const BUILDER_WORDS = WORDS.filter(w => lettersOf(w.word).length <= 8);
type BuilderLevel = 'easy' | 'medium' | 'hard';
const BUILDER_LEVELS: Record<BuilderLevel, (w: GameWord) => boolean> = {
  easy: w => lettersOf(w.word).length <= 3,
  medium: w => { const n = lettersOf(w.word).length; return n >= 4 && n <= 5; },
  hard: w => lettersOf(w.word).length >= 6
};
const FILLER_LETTERS = ['A', 'B', 'D', 'E', 'I', 'K', 'L', 'M', 'N', 'O', 'R', 'T', 'Y'];
const DECOY_LETTERS = ['A', 'B', 'D', 'E', 'Ẹ', 'I', 'K', 'L', 'M', 'N', 'O', 'Ọ', 'R', 'Ṣ', 'T', 'W', 'Y'];

function readBest(): number {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (_e) { return 0; }
}
function saveBest(n: number) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (_e) {}
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
let currentVoice: HTMLAudioElement | null = null;

async function speakYoruba(text: string): Promise<boolean> {
  if (currentVoice) { currentVoice.pause(); currentVoice = null; }
  try {
    const res = await fetchAudioTTS(text, 'yo');
    if (!res.audioUrl) return false;
    const audio = new Audio(res.audioUrl);
    currentVoice = audio;
    gameAudio.duck();
    const done = () => { gameAudio.unduck(); if (currentVoice === audio) currentVoice = null; };
    audio.onended = done;
    audio.onerror = done;
    await audio.play();
    return true;
  } catch (_e) {
    gameAudio.unduck();
    return false;
  }
}

function stopVoice() {
  if (currentVoice) { currentVoice.pause(); currentVoice = null; }
  gameAudio.unduck();
}

const ListenButton: React.FC<{ text: string; label?: string; className?: string }> = ({ text, label = 'Listen', className = '' }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  return (
    <button
      onClick={async e => {
        e.stopPropagation();
        gameAudio.sfx('tap');
        setState('loading');
        setState((await speakYoruba(text)) ? 'idle' : 'error');
      }}
      aria-label={`Listen to ${text}`}
      className={`${PRESS} ${className}`}
    >
      {state === 'loading' ? '⏳' : state === 'error' ? '🔁' : '🔊'}{label ? ` ${label}` : ''}
    </button>
  );
};

// ---------- game models ----------
interface Candy {
  id: number;
  l: string;
  r: number;
  c: number;
  shownR: number;
  boom: boolean;
  hint: boolean;
}

interface LetterCrushModel {
  word: GameWord;
  types: string[];
  look: Record<string, typeof CANDY_LOOKS[number]>;
  goals: { l: string; got: number }[];
  moves: number;
  busy: boolean;
  sel: Candy | null;
  round: number;
  perfect: boolean;
  learned: GameWord[];
  overlay: 'done' | 'out' | null;
  cascade: number;
}

interface BuilderModel {
  level: BuilderLevel;
  word: GameWord;
  units: string[];
  placed: string[];
  tiles: { id: number; l: string; used: boolean }[];
  busy: boolean;
  round: number;
  perfect: boolean;
  learned: GameWord[];
}

interface CatchItem {
  id: number;
  word: GameWord;
  x: number;
  y: number;
  speed: number;
  gone: boolean;
}

interface CatchModel {
  lives: number;
  catches: number;
  target: GameWord;
  sinceTarget: number;
  items: CatchItem[];
  running: boolean;
  learned: GameWord[];
  lostLife: boolean;
}

type Screen = 'home' | 'lc' | 'wb' | 'sc' | 'results';
type GameKey = 'lc' | 'wb' | 'sc';

interface RoundResult {
  game: GameKey;
  got: number;
  total: number;
  perfect: boolean;
  learned: GameWord[];
}

const GAME_NAMES: Record<GameKey, string> = {
  lc: '🍬 Letter Crush',
  wb: '🏗️ Word Builder',
  sc: '⚡ Speed Catch'
};

export const NaijaWordCrush: React.FC<NaijaWordCrushProps> = ({ profile, onBackToApp, onProfileUpdate }) => {
  useFunFonts();

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [screen, setScreen] = useState<Screen>('home');
  const screenRef = useRef<Screen>('home');
  screenRef.current = screen;
  const [, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);
  const [needsTap, setNeedsTap] = useState(false);
  const [musicOn, setMusicOn] = useState(gameAudio.isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(gameAudio.isSfxEnabled());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [best, setBest] = useState(readBest());
  const [coinsPop, setCoinsPop] = useState<string | null>(null);
  // Share card shown when the phone has no share menu of its own.
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const coins = profile?.coins || 0;

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const award = (n: number) => {
    const p = profileRef.current;
    gameAudio.sfx('coin');
    setCoinsPop(`+${n} 🪙`);
    setTimeout(() => setCoinsPop(null), 1000);
    if (p && onProfileUpdate) onProfileUpdate({ ...p, coins: (p.coins || 0) + n });
  };

  const spend = (n: number): boolean => {
    const p = profileRef.current;
    if (!p || !onProfileUpdate || (p.coins || 0) < n) return false;
    onProfileUpdate({ ...p, coins: (p.coins || 0) - n });
    return true;
  };

  const bigConfetti = () => {
    const base = { spread: 80, zIndex: 9999, colors: CONFETTI_COLORS };
    confetti({ ...base, particleCount: 150, origin: { y: 0.6 } });
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 120, origin: { x: 1, y: 0.7 } }), 450);
  };

  // ---------- music ----------
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
      stopCatch();
      clearHint();
      gameAudio.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (needsTap) return;
    gameAudio.playMusic(screen === 'home' || screen === 'results' ? 'hub' : 'game');
  }, [screen, needsTap]);

  const handleTapToPlay = async () => {
    const ok = await gameAudio.unlock();
    if (!ok) return;
    setNeedsTap(false);
    gameAudio.sfx('go');
  };

  // The first tap anywhere starts the music if the browser held it back.
  useEffect(() => {
    if (!needsTap) return;
    const onFirstTap = () => { handleTapToPlay(); };
    document.addEventListener('pointerdown', onFirstTap, { once: true, capture: true });
    return () => document.removeEventListener('pointerdown', onFirstTap, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTap]);

  const finishRound = (game: GameKey, got: number, total: number, perfect: boolean, learned: GameWord[]) => {
    stopVoice();
    setResult({ game, got, total, perfect, learned });
    setScreen('results');
    window.scrollTo({ top: 0 });
    // Confetti and the fanfare only for a perfect round.
    if (perfect) {
      gameAudio.sfx('win');
      bigConfetti();
    }
  };

  const goHome = () => {
    stopCatch();
    clearHint();
    stopVoice();
    setScreen('home');
    window.scrollTo({ top: 0 });
  };

  // =====================================================================
  // 1. LETTER CRUSH (Candy Crush style)
  // =====================================================================
  const lcDeck = useRef(makeDeck(LC_WORDS));
  const lc = useRef<LetterCrushModel | null>(null);
  const grid = useRef<(Candy | null)[][]>([]);
  const candies = useRef(new Map<number, Candy>());
  const candyEls = useRef(new Map<number, HTMLDivElement>());
  const candyId = useRef(0);
  const touch = useRef<{ cd: Candy; x: number; y: number } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [praise, setPraise] = useState<{ text: string; row: number; key: number } | null>(null);

  const neededLetters = () => (lc.current ? lc.current.goals.filter(g => g.got < NEED_PER_LETTER).map(g => g.l) : []);

  const pickLetter = () => {
    const m = lc.current!;
    const need = neededLetters();
    if (need.length && Math.random() < 0.3) return need[Math.floor(Math.random() * need.length)];
    return m.types[Math.floor(Math.random() * m.types.length)];
  };

  const makeCandy = (l: string, r: number, c: number, fromRow: number): Candy => {
    const cd: Candy = { id: ++candyId.current, l, r, c, shownR: fromRow, boom: false, hint: false };
    candies.current.set(cd.id, cd);
    return cd;
  };

  // New candies start above the board, then slide down into place.
  const landNewCandies = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      candies.current.forEach(cd => { cd.shownR = cd.r; });
      bump();
    }));
  };

  const findRuns = (): Candy[][] => {
    const runs: Candy[][] = [];
    const g = grid.current;
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        let e = c;
        while (e + 1 < N && g[r][e + 1] && g[r][c] && g[r][e + 1]!.l === g[r][c]!.l) e++;
        if (e - c + 1 >= 3) runs.push(Array.from({ length: e - c + 1 }, (_, k) => g[r][c + k]!));
        c = e + 1;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        let e = r;
        while (e + 1 < N && g[e + 1][c] && g[r][c] && g[e + 1][c]!.l === g[r][c]!.l) e++;
        if (e - r + 1 >= 3) runs.push(Array.from({ length: e - r + 1 }, (_, k) => g[r + k][c]!));
        r = e + 1;
      }
    }
    return runs;
  };

  const findMove = (): [Candy, Candy] | null => {
    const g = grid.current.map(row => row.map(cd => (cd ? cd.l : '')));
    const has3 = () => {
      for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) if (g[r][c] && g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) return true;
      for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) if (g[r][c] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) return true;
      return false;
    };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= N || c2 >= N) continue;
      [g[r][c], g[r2][c2]] = [g[r2][c2], g[r][c]];
      const ok = has3();
      [g[r][c], g[r2][c2]] = [g[r2][c2], g[r][c]];
      if (ok) return [grid.current[r][c]!, grid.current[r2][c2]!];
    }
    return null;
  };

  function clearHint() {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    candies.current.forEach(cd => { cd.hint = false; });
  }

  // After a few seconds without a move, two candies wiggle to show a match.
  const armHint = () => {
    clearHint();
    hintTimer.current = setTimeout(() => {
      if (!lc.current || lc.current.busy) return;
      const move = findMove();
      if (!move) return;
      move.forEach(cd => { cd.hint = true; });
      bump();
    }, 6000);
  };

  const buildBoard = () => {
    candies.current.clear();
    grid.current = [];
    for (let r = 0; r < N; r++) {
      grid.current.push([]);
      for (let c = 0; c < N; c++) {
        let l = '';
        let tries = 0;
        do {
          l = pickLetter();
          tries++;
        } while (tries < 30 && (
          (c >= 2 && grid.current[r][c - 1]!.l === l && grid.current[r][c - 2]!.l === l) ||
          (r >= 2 && grid.current[r - 1][c]!.l === l && grid.current[r - 2][c]!.l === l)));
        grid.current[r].push(makeCandy(l, r, c, r - N));
      }
    }
    bump();
    landNewCandies();
    if (!findMove()) {
      showToast('No moves! Shuffling... 🔄');
      setTimeout(buildBoard, 600);
      return;
    }
    armHint();
  };

  const nextLCWord = (round: number, perfect: boolean, learned: GameWord[]) => {
    const w = lcDeck.current();
    const unique = Array.from(new Set(lettersOf(w.word)));
    const fillers = shuffle(FILLER_LETTERS.filter(l => !unique.includes(l)));
    const types = [...unique];
    while (types.length < 4) types.push(fillers.shift()!); // at least 4 kinds of candy = easy matches
    lc.current = {
      word: w,
      types,
      look: Object.fromEntries(types.map((l, i) => [l, CANDY_LOOKS[i % CANDY_LOOKS.length]])),
      goals: unique.map(l => ({ l, got: 0 })),
      moves: MOVES_PER_WORD,
      busy: false,
      sel: null,
      round,
      perfect,
      learned,
      overlay: null,
      cascade: 0
    };
    buildBoard();
    setTimeout(() => { if (screenRef.current === 'lc') speakYoruba(w.word); }, 400);
  };

  const startLC = () => {
    stopVoice();
    setScreen('lc');
    window.scrollTo({ top: 0 });
    nextLCWord(0, true, []);
  };

  const setCandyPos = (cd: Candy, r: number, c: number) => {
    cd.r = r;
    cd.c = c;
    cd.shownR = r;
    grid.current[r][c] = cd;
  };

  const swapCells = (a: Candy, b: Candy) => {
    const ar = a.r, ac = a.c;
    setCandyPos(a, b.r, b.c);
    setCandyPos(b, ar, ac);
    bump();
  };

  const splashAt = (run: Candy[]) => {
    const rects = run.map(cd => candyEls.current.get(cd.id)?.getBoundingClientRect()).filter(Boolean) as DOMRect[];
    if (rects.length === 0) return;
    const x = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length / window.innerWidth;
    const y = rects.reduce((s, r) => s + r.top + r.height / 2, 0) / rects.length / window.innerHeight;
    confetti({
      particleCount: run.length >= 5 ? 120 : run.length === 4 ? 70 : 35,
      spread: run.length >= 4 ? 100 : 70,
      startVelocity: run.length >= 4 ? 45 : 32,
      origin: { x, y },
      zIndex: 9999,
      colors: CONFETTI_COLORS
    });
  };

  const crush = () => {
    const m = lc.current;
    if (!m) return;
    const runs = findRuns();
    if (runs.length === 0) {
      m.busy = false;
      afterTurn();
      return;
    }
    m.cascade++;
    const burst = new Set<Candy>();
    runs.forEach(run => run.forEach(cd => burst.add(cd)));
    // Every candy burst counts towards the word's letters.
    burst.forEach(cd => {
      const goal = m.goals.find(g => g.l === cd.l);
      if (goal) goal.got = Math.min(NEED_PER_LETTER, goal.got + 1);
    });
    gameAudio.sfx('splash');
    if (m.cascade > 1) gameAudio.sfx('combo');
    runs.forEach(splashAt);
    const biggest = Math.max(...runs.map(r => r.length));
    if (biggest >= 4 || m.cascade > 1) {
      setPraise({ text: PRAISE[Math.floor(Math.random() * PRAISE.length)], row: runs[0][0].r, key: Date.now() });
      setTimeout(() => setPraise(null), 900);
    }
    burst.forEach(cd => { cd.boom = true; });
    bump();

    setTimeout(() => {
      burst.forEach(cd => {
        candies.current.delete(cd.id);
        grid.current[cd.r][cd.c] = null;
      });
      // Gravity: candies fall, new ones drop in from the top.
      for (let c = 0; c < N; c++) {
        const column: Candy[] = [];
        for (let r = N - 1; r >= 0; r--) if (grid.current[r][c]) column.push(grid.current[r][c]!);
        let r = N - 1;
        column.forEach(cd => { setCandyPos(cd, r, c); r--; });
        let k = 1;
        for (; r >= 0; r--, k++) grid.current[r][c] = makeCandy(pickLetter(), r, c, -k);
      }
      bump();
      landNewCandies();
      setTimeout(crush, 320);
    }, 230);
  };

  const trySwap = (a: Candy, b: Candy) => {
    const m = lc.current;
    if (!m || m.busy) return;
    clearHint();
    m.busy = true;
    gameAudio.sfx('whoosh');
    swapCells(a, b);
    setTimeout(() => {
      if (findRuns().length === 0) {
        gameAudio.sfx('wrong');
        swapCells(a, b); // not a match: the candies slide back
        setTimeout(() => { m.busy = false; armHint(); }, 240);
      } else {
        m.moves--;
        m.cascade = 0;
        crush();
      }
    }, 240);
  };

  function afterTurn() {
    const m = lc.current;
    if (!m) return;
    if (m.goals.every(g => g.got >= NEED_PER_LETTER)) {
      m.busy = true;
      m.overlay = 'done';
      m.learned = [...m.learned, m.word];
      clearHint();
      gameAudio.sfx('win');
      speakYoruba(m.word.word);
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, zIndex: 9999, colors: CONFETTI_COLORS });
      award(10);
    } else if (m.moves <= 0) {
      m.busy = true;
      m.overlay = 'out';
      m.perfect = false;
      clearHint();
      gameAudio.sfx('wrong');
    } else if (!findMove()) {
      showToast('No moves left! Shuffling... 🔄');
      gameAudio.sfx('whoosh');
      setTimeout(buildBoard, 500);
    } else {
      armHint();
    }
    bump();
  }

  const lcNext = () => {
    const m = lc.current!;
    const round = m.round + 1;
    if (round >= WORDS_PER_ROUND) {
      finishRound('lc', round, WORDS_PER_ROUND, m.perfect, m.learned);
      return;
    }
    nextLCWord(round, m.perfect, m.learned);
  };

  const lcRetry = () => {
    const m = lc.current!;
    m.moves = MOVES_PER_WORD;
    m.busy = false;
    m.sel = null;
    m.overlay = null;
    m.goals.forEach(g => { g.got = 0; });
    buildBoard();
  };

  // Swipe, or tap one candy then the one next to it.
  useEffect(() => {
    if (screen !== 'lc') return;
    const onUp = (e: PointerEvent) => {
      const t = touch.current;
      touch.current = null;
      const m = lc.current;
      if (!t || !m || m.busy) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (Math.hypot(dx, dy) > 16) {
        let r2 = t.cd.r, c2 = t.cd.c;
        if (Math.abs(dx) > Math.abs(dy)) c2 += dx > 0 ? 1 : -1;
        else r2 += dy > 0 ? 1 : -1;
        if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N) {
          m.sel = null;
          trySwap(t.cd, grid.current[r2][c2]!);
        }
        return;
      }
      if (!m.sel) {
        m.sel = t.cd;
        gameAudio.sfx('tap');
      } else {
        const a = m.sel;
        m.sel = null;
        if (a !== t.cd) {
          if (Math.abs(a.r - t.cd.r) + Math.abs(a.c - t.cd.c) === 1) trySwap(a, t.cd);
          else { m.sel = t.cd; gameAudio.sfx('tap'); }
        }
      }
      bump();
    };
    document.addEventListener('pointerup', onUp);
    return () => document.removeEventListener('pointerup', onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // =====================================================================
  // 2. WORD BUILDER
  // =====================================================================
  const wbDecks = useRef<Record<BuilderLevel, () => GameWord>>({
    easy: makeDeck(BUILDER_WORDS.filter(BUILDER_LEVELS.easy)),
    medium: makeDeck(BUILDER_WORDS.filter(BUILDER_LEVELS.medium)),
    hard: makeDeck(BUILDER_WORDS.filter(BUILDER_LEVELS.hard))
  });
  const wb = useRef<BuilderModel | null>(null);
  const [wobble, setWobble] = useState<{ id: number; n: number } | null>(null);

  const nextWBWord = (level: BuilderLevel, round: number, perfect: boolean, learned: GameWord[]) => {
    const w = wbDecks.current[level]();
    const units = lettersOf(w.word);
    const decoys = level === 'easy'
      ? []
      : shuffle(DECOY_LETTERS.filter(l => !units.includes(l))).slice(0, level === 'hard' ? 3 : 2);
    wb.current = {
      level,
      word: w,
      units,
      placed: [],
      tiles: shuffle([...units, ...decoys].map((l, i) => ({ id: i, l, used: false }))),
      busy: false,
      round,
      perfect,
      learned
    };
    bump();
    setTimeout(() => { if (screenRef.current === 'wb') speakYoruba(w.word); }, 400);
  };

  const startWB = (level?: BuilderLevel) => {
    stopVoice();
    setScreen('wb');
    window.scrollTo({ top: 0 });
    nextWBWord(level || wb.current?.level || 'easy', 0, true, []);
  };

  const wbComplete = () => {
    const m = wb.current!;
    m.busy = true;
    m.learned = [...m.learned, m.word];
    gameAudio.sfx('combo');
    speakYoruba(m.word.word);
    award(10);
    bump();
    setTimeout(() => {
      const round = m.round + 1;
      if (round >= WORDS_PER_ROUND) finishRound('wb', round, WORDS_PER_ROUND, m.perfect, m.learned);
      else nextWBWord(m.level, round, m.perfect, m.learned);
    }, 1900);
  };

  const wbTap = (id: number) => {
    const m = wb.current;
    if (!m || m.busy) return;
    const tile = m.tiles.find(t => t.id === id);
    if (!tile || tile.used) return;
    if (tile.l !== m.units[m.placed.length]) {
      // Wrong letter: it wobbles and stays, the child keeps going.
      m.perfect = false;
      gameAudio.sfx('wrong');
      setWobble(prev => ({ id, n: (prev?.n || 0) + 1 }));
      return;
    }
    tile.used = true;
    m.placed.push(tile.l);
    gameAudio.sfx('correct');
    bump();
    if (m.placed.length === m.units.length) wbComplete();
  };

  const wbHint = () => {
    const m = wb.current;
    if (!m || m.busy || m.placed.length >= m.units.length) return;
    if (!spend(HINT_COST)) {
      showToast(`You need ${HINT_COST} 🪙 for a hint`);
      return;
    }
    m.perfect = false;
    const tile = m.tiles.find(t => !t.used && t.l === m.units[m.placed.length])!;
    tile.used = true;
    m.placed.push(tile.l);
    gameAudio.sfx('whoosh');
    bump();
    if (m.placed.length === m.units.length) wbComplete();
  };

  // =====================================================================
  // 3. SPEED CATCH
  // =====================================================================
  const sc = useRef<CatchModel | null>(null);
  const field = useRef<HTMLDivElement | null>(null);
  const bubbleEls = useRef(new Map<number, HTMLButtonElement>());
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const raf = useRef<number | null>(null);
  const itemId = useRef(0);

  function stopCatch() {
    if (sc.current) sc.current.running = false;
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    spawnTimer.current = null;
    raf.current = null;
  }

  const newTarget = () => {
    const m = sc.current!;
    const pool = WORDS.filter(w => w.id !== m.target?.id);
    m.target = pool[Math.floor(Math.random() * pool.length)];
    m.sinceTarget = 0;
  };

  const endCatch = () => {
    const m = sc.current!;
    stopCatch();
    setTimeout(() => finishRound('sc', m.catches, CATCH_GOAL, m.catches >= CATCH_GOAL && !m.lostLife, m.learned), 500);
  };

  const loseLife = (msg: string) => {
    const m = sc.current!;
    m.lives--;
    m.lostLife = true;
    gameAudio.sfx('wrong');
    showToast(msg);
    bump();
    if (m.lives <= 0) endCatch();
  };

  const spawn = () => {
    const m = sc.current;
    if (!m || !m.running) return;
    // The right word falls at least every third drop.
    const isTarget = m.sinceTarget >= 2 || Math.random() < 0.35;
    const others = WORDS.filter(w => w.id !== m.target.id);
    const word = isTarget ? m.target : others[Math.floor(Math.random() * others.length)];
    m.sinceTarget = isTarget ? 0 : m.sinceTarget + 1;
    m.items.push({ id: ++itemId.current, word, x: 12 + Math.random() * 76, y: -60, speed: 1.6 + m.catches * 0.15, gone: false });
    bump();
  };

  const startSC = () => {
    stopCatch();
    stopVoice();
    const first = WORDS[Math.floor(Math.random() * WORDS.length)];
    sc.current = { lives: 3, catches: 0, target: first, sinceTarget: 0, items: [], running: true, learned: [], lostLife: false };
    setScreen('sc');
    window.scrollTo({ top: 0 });
    spawnTimer.current = setInterval(spawn, 1300);
    let last = performance.now();
    const step = (t: number) => {
      const m = sc.current;
      if (!m || !m.running) return;
      const dt = Math.min(50, t - last);
      last = t;
      const height = (field.current && field.current.clientHeight) || 420;
      let changed = false;
      m.items.forEach(it => {
        if (it.gone) return;
        it.y += (it.speed * dt) / 16;
        const el = bubbleEls.current.get(it.id);
        if (el) el.style.top = `${it.y}px`;
        if (it.y > height - 40) {
          it.gone = true;
          changed = true;
          if (it.word.id === m.target.id) loseLife(`Oops! "${m.target.word}" got away`);
        }
      });
      if (changed) {
        m.items = m.items.filter(it => !it.gone);
        bump();
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const catchIt = (it: CatchItem) => {
    const m = sc.current;
    if (!m || !m.running || it.gone) return;
    if (it.word.id === m.target.id) {
      it.gone = true;
      m.items = m.items.filter(x => !x.gone);
      m.catches++;
      m.learned = [...m.learned, it.word];
      gameAudio.sfx('correct');
      award(5);
      speakYoruba(it.word.word);
      if (m.catches > best) { setBest(m.catches); saveBest(m.catches); }
      if (m.catches >= CATCH_GOAL) { bump(); endCatch(); return; }
      newTarget();
      bump();
    } else {
      setWobble(prev => ({ id: -it.id, n: (prev?.n || 0) + 1 }));
      loseLife(`That's "${it.word.en}". Look for "${m.target.en}"!`);
    }
  };

  // =====================================================================
  // RENDER
  // =====================================================================
  const TopBar = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {(screen !== 'home' || onBackToApp) && (
          <button
            onClick={() => (screen === 'home' ? onBackToApp?.() : goHome())}
            aria-label={screen === 'home' ? 'Back to Game Zone' : 'Back to Word Crush games'}
            className={`${PRESS} w-11 h-11 rounded-full bg-white/15 font-bold`}
          >
            ◀
          </button>
        )}
        <span className="relative px-3 py-1.5 rounded-full bg-[#FFC83D] text-[#064E3B] font-extrabold text-sm">
          <span className="inline-flex items-center gap-1"><Emoji3D emoji="🪙" className="w-5 h-5" /> {coins}</span>
          {coinsPop && (
            <span className={`${FUN} absolute left-1/2 -translate-x-1/2 -top-8 text-2xl font-bold text-[#FFC83D] animate-bounce whitespace-nowrap`}>
              {coinsPop}
            </span>
          )}
        </span>
      </div>
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
    </div>
  );

  const m1 = lc.current;
  const m2 = wb.current;
  const m3 = sc.current;

  return (
    <div className={`max-w-2xl mx-auto p-3 sm:p-6 pb-28 ${READ}`}>
      <style>{STYLES}</style>
      <div className="relative rounded-[32px] overflow-hidden text-white text-[17px] p-4 sm:p-6 space-y-5 min-h-[80vh]" style={STARRY}>
        {TopBar}

        {/* ================= HOME ================= */}
        {screen === 'home' && (
          <div className="space-y-5">
            <div className="text-center pt-1 space-y-1">
              <p className={`${FUN} text-5xl font-bold tracking-tight`}>
                Word Crush <Emoji3D emoji="🍬" className="inline-block w-12 h-12 align-middle animate-bounce" />
              </p>
              <p className="text-white/70 font-semibold">Three Yorùbá word games. Pick one!</p>
              <p className="pt-1">
                <span className={`${FUN} inline-block px-4 py-1.5 rounded-full bg-white/10 font-semibold`}>
                  📚 {WORDS.length} Yorùbá words · no repeats
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={startLC}
                className={`${PRESS} w-full text-left rounded-[28px] p-5 bg-gradient-to-br from-[#DB2777] to-[#7E22CE] border-b-[8px] border-[#4C1D95] flex items-center gap-4`}
              >
                <Emoji3D emoji="🍬" className="w-16 h-16 shrink-0" />
                <span className="flex-1">
                  <span className={`${FUN} block text-3xl font-bold`}>Letter Crush</span>
                  <span className="block font-semibold text-white/85">Match 3 candies to collect the word's letters</span>
                </span>
                <span className={`${FUN} text-3xl font-bold`}>▶</span>
              </button>
              <button
                onClick={() => startWB()}
                className={`${PRESS} w-full text-left rounded-[28px] p-5 bg-gradient-to-br from-[#16A34A] to-[#0284C7] border-b-[8px] border-[#075985] flex items-center gap-4`}
              >
                <Emoji3D emoji="🏗️" className="w-16 h-16 shrink-0" />
                <span className="flex-1">
                  <span className={`${FUN} block text-3xl font-bold`}>Word Builder</span>
                  <span className="block font-semibold text-white/85">Spell the Yorùbá word, letter by letter</span>
                </span>
                <span className={`${FUN} text-3xl font-bold`}>▶</span>
              </button>
              <button
                onClick={startSC}
                className={`${PRESS} w-full text-left rounded-[28px] p-5 bg-gradient-to-br from-[#FFC83D] to-[#FF6B35] border-b-[8px] border-[#D9480F] text-[#2E1065] flex items-center gap-4`}
              >
                <Emoji3D emoji="⚡" className="w-16 h-16 shrink-0" />
                <span className="flex-1">
                  <span className={`${FUN} block text-3xl font-bold`}>Speed Catch</span>
                  <span className="block font-bold opacity-80">Catch the right word before it lands!</span>
                </span>
                <span className={`${FUN} text-3xl font-bold`}>▶</span>
              </button>
            </div>

            <div className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 text-center space-y-1">
              <p className="font-semibold text-white/70 inline-flex items-center gap-2 justify-center">
                <Emoji3D emoji="🏆" className="w-7 h-7" /> Best Speed Catch: <b className="text-[#FFC83D]">{best}</b> catches
              </p>
              <p className="text-xs font-bold text-white/40">Igbo &amp; Hausa coming soon</p>
            </div>
          </div>
        )}

        {/* ================= LETTER CRUSH ================= */}
        {screen === 'lc' && m1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={`${FUN} text-2xl font-bold`}>🍬 Letter Crush</p>
              <p className={`${FUN} font-semibold text-white/70`}>Word {m1.round + 1} of {WORDS_PER_ROUND}</p>
            </div>

            <div className="rounded-3xl bg-white/10 p-3 space-y-3">
              <div className="flex items-center gap-3">
                <Emoji3D emoji={m1.word.emoji} className="w-14 h-14 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`${FUN} text-2xl font-bold text-[#FFC83D] leading-tight`}>{m1.word.word}</p>
                  <p className="font-bold text-white/80">"{m1.word.en}"</p>
                </div>
                <ListenButton text={m1.word.word} label="" className="w-12 h-12 rounded-2xl bg-[#38BDF8] border-b-4 border-[#0284C7] text-2xl shrink-0" />
              </div>
              <p className="text-sm font-bold text-white/70">Crush these letters to finish the word:</p>
              <div className="flex flex-wrap gap-2">
                {m1.goals.map(goal => {
                  const done = goal.got >= NEED_PER_LETTER;
                  return (
                    <span key={goal.l} className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full ${done ? 'bg-[#16A34A]' : 'bg-white/15'}`}>
                      <span className={`${FUN} w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold`} style={{ background: m1.look[goal.l].bg }}>
                        {goal.l}
                      </span>
                      <span className={`${FUN} font-bold`}>{done ? '✓' : `${goal.got}/${NEED_PER_LETTER}`}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className={`${FUN} px-4 py-2 rounded-2xl font-bold ${m1.moves <= 5 ? 'bg-[#FF6B35] animate-pulse' : 'bg-white/15'}`}>
                👟 {m1.moves} moves
              </span>
              <span className="text-sm font-bold text-white/60">Swap 2 candies to make a line of 3!</span>
            </div>

            <div className="rounded-[28px] p-2 bg-gradient-to-b from-[#FFC83D] to-[#FF6B35] border-b-[6px] border-[#D9480F]">
              <div className="relative w-full aspect-square rounded-[22px] bg-[#1E1B4B]/90 overflow-hidden touch-none select-none">
                {Array.from(candies.current.values()).map(cd => {
                  const look = m1.look[cd.l] || CANDY_LOOKS[0];
                  return (
                    <div
                      key={cd.id}
                      ref={el => {
                        if (el) candyEls.current.set(cd.id, el);
                        else candyEls.current.delete(cd.id);
                      }}
                      className={`wc-candy ${cd.boom ? 'boom' : ''} ${cd.hint ? 'hint' : ''} ${m1.sel === cd ? 'sel' : ''}`}
                      style={{ top: `${(cd.shownR * 100) / N}%`, left: `${(cd.c * 100) / N}%` }}
                      onPointerDown={e => {
                        e.preventDefault();
                        touch.current = { cd, x: e.clientX, y: e.clientY };
                      }}
                    >
                      <span className={`shape ${look.shape}`} style={{ background: look.bg }}>
                        <b>{cd.l}</b>
                      </span>
                    </div>
                  );
                })}
                {praise && (
                  <div
                    key={praise.key}
                    className={`${FUN} wc-praise absolute z-10 text-3xl sm:text-4xl font-bold text-white pointer-events-none`}
                    style={{ top: `${(praise.row * 100) / N}%`, left: '50%' }}
                  >
                    {praise.text}
                  </div>
                )}
              </div>
            </div>

            {m1.overlay && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2E1065]/80 p-6">
                <div className="wc-pop rounded-[28px] bg-white text-[#2E1065] p-6 text-center space-y-3 max-w-sm w-full border-b-8 border-slate-300">
                  {m1.overlay === 'done' ? (
                    <>
                      <Emoji3D emoji={m1.word.emoji} className="w-20 h-20 mx-auto" />
                      <p className={`${FUN} text-4xl font-bold text-[#7E22CE]`}>{m1.word.word}</p>
                      <p className={`${FUN} text-xl font-semibold`}>"{m1.word.en}"</p>
                      <p className="font-bold text-[#16A34A]">Word complete! +10 🪙</p>
                      <ListenButton
                        text={m1.word.word}
                        label="Hear it again"
                        className="px-4 py-2 rounded-full bg-[#E0F4FF] text-[#0284C7] font-extrabold border-b-[3px] border-[#38BDF8]"
                      />
                      <button
                        onClick={lcNext}
                        className={`${PRESS} ${FUN} w-full py-3.5 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-xl font-bold border-b-[6px] border-[#E0A800]`}
                      >
                        {m1.round + 1 >= WORDS_PER_ROUND ? 'See my score 🏆' : 'Next word ▶'}
                      </button>
                    </>
                  ) : (
                    <>
                      <Emoji3D emoji="💪" className="w-20 h-20 mx-auto" />
                      <p className={`${FUN} text-3xl font-bold`}>Out of moves!</p>
                      <p className="font-semibold">So close! Let's try "{m1.word.word}" again.</p>
                      <button
                        onClick={lcRetry}
                        className={`${PRESS} ${FUN} w-full py-3.5 rounded-2xl bg-[#FF6B35] text-white text-xl font-bold border-b-[6px] border-[#D9480F]`}
                      >
                        🔁 Try again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= WORD BUILDER ================= */}
        {screen === 'wb' && m2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={`${FUN} text-2xl font-bold`}>🏗️ Word Builder</p>
              <p className={`${FUN} font-semibold text-white/70`}>Word {m2.round + 1} of {WORDS_PER_ROUND}</p>
            </div>
            <div className="flex justify-center gap-2">
              {(['easy', 'medium', 'hard'] as BuilderLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => startWB(level)}
                  className={`${PRESS} px-4 py-2 rounded-full text-sm font-extrabold ${m2.level === level ? 'bg-[#FFC83D] text-[#064E3B]' : 'bg-white/10'}`}
                >
                  {level === 'easy' ? '🌱 Easy' : level === 'medium' ? '🌿 Medium' : '🌳 Hard'}
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-white text-slate-800 p-5 text-center space-y-2 border-b-[6px] border-slate-300">
              <Emoji3D emoji={m2.word.emoji} className="w-20 h-20 mx-auto" />
              <p className={`${FUN} text-2xl font-bold`}>"{m2.word.en}"</p>
              {m2.placed.length === m2.units.length ? (
                <p className={`${FUN} text-4xl font-bold text-[#7E22CE] wc-pop`}>{m2.word.word}</p>
              ) : (
                <p className="text-sm font-bold text-slate-500">Build the Yorùbá word</p>
              )}
              <div className="flex justify-center">
                <ListenButton
                  text={m2.word.word}
                  className="px-4 py-2 rounded-full bg-[#E0F4FF] text-[#0284C7] font-extrabold border-b-[3px] border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 min-h-[4rem]">
              {m2.units.map((_, i) => {
                const letter = m2.placed[i];
                return (
                  <span
                    key={i}
                    className={`${FUN} w-14 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold ${
                      letter ? `${TILE_COLORS[i % TILE_COLORS.length]} border-b-[5px] wc-pop` : 'bg-white/10 border-2 border-dashed border-white/25'
                    }`}
                  >
                    {letter || ''}
                  </span>
                );
              })}
            </div>

            <div className="rounded-3xl bg-black/25 p-4">
              <div className="flex flex-wrap justify-center gap-3">
                {m2.tiles.map(tile => (
                  <button
                    key={wobble && wobble.id === tile.id ? `${tile.id}-${wobble.n}` : tile.id}
                    onClick={() => wbTap(tile.id)}
                    disabled={tile.used}
                    className={`${PRESS} ${FUN} w-14 h-16 rounded-2xl border-b-[6px] text-3xl font-bold ${
                      tile.used ? 'opacity-0' : 'bg-white text-[#2E1065] border-slate-300'
                    } ${wobble && wobble.id === tile.id ? 'wc-wobble' : ''}`}
                  >
                    {tile.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={wbHint} className={`${PRESS} ${FUN} px-5 py-2.5 rounded-2xl bg-white/15 font-semibold`}>
                💡 Hint ({HINT_COST} 🪙)
              </button>
            </div>
          </div>
        )}

        {/* ================= SPEED CATCH ================= */}
        {screen === 'sc' && m3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={`${FUN} text-2xl font-bold`}>⚡ Speed Catch</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-label={`${m3.lives} lives left`}>
                  <span className="inline-flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <Emoji3D key={i} emoji="❤️" className={`w-7 h-7 ${i < m3.lives ? '' : 'opacity-25 grayscale'}`} />
                    ))}
                  </span>
                </span>
                <span className={`${FUN} px-4 py-2 rounded-2xl bg-white/15 font-bold`}>⚡ {m3.catches} / {CATCH_GOAL}</span>
              </div>
            </div>
            <div className="rounded-3xl bg-[#FFC83D] text-[#2E1065] p-4 text-center border-b-[6px] border-[#E0A800]">
              <p className="font-bold text-sm">Catch the Yorùbá word for</p>
              <p key={m3.target.id} className={`${FUN} text-3xl font-bold wc-pop inline-flex items-center gap-2 justify-center`}>
                <Emoji3D emoji={m3.target.emoji} className="w-10 h-10" /> "{m3.target.en}"
              </p>
            </div>
            <div
              ref={field}
              className="relative h-[420px] rounded-3xl bg-gradient-to-b from-[#1E1B4B] to-[#064E3B] border-4 border-white/10 overflow-hidden"
            >
              {m3.items.filter(it => !it.gone).map(it => (
                <button
                  key={wobble && wobble.id === -it.id ? `${it.id}-${wobble.n}` : it.id}
                  ref={el => {
                    if (el) bubbleEls.current.set(it.id, el);
                    else bubbleEls.current.delete(it.id);
                  }}
                  onPointerDown={() => catchIt(it)}
                  className={`wc-bubble ${FUN} px-4 py-3 rounded-full bg-white text-[#2E1065] font-bold text-xl border-b-[5px] border-slate-300 shadow-xl whitespace-nowrap ${
                    wobble && wobble.id === -it.id ? 'wc-wobble' : ''
                  }`}
                  style={{ left: `${it.x}%`, top: `${it.y}px` }}
                >
                  <span className="inline-flex items-center gap-2"><Emoji3D emoji={it.word.emoji} className="w-8 h-8" /> {it.word.word}</span>
                </button>
              ))}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-[#16A34A] via-[#FFC83D] to-[#16A34A] opacity-70" />
            </div>
            <p className="text-center text-white/60 text-sm font-semibold">Tap the right word before it hits the grass! 🌿</p>
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {screen === 'results' && result && (() => {
          const ratio = result.total ? result.got / result.total : 0;
          const stars = Math.max(1, Math.round(ratio * 5));
          const seen = new Set<string>();
          const learned = result.learned.filter(w => !seen.has(w.id) && seen.add(w.id));
          return (
            <div className="space-y-4 text-center wc-pop">
              <p className={`${FUN} text-4xl font-bold text-[#FFC83D] pt-4`}>
                {result.perfect ? 'Ẹ kú iṣẹ́! Perfect!' : ratio >= 0.5 ? 'Ó dára! Well done!' : 'Kò burú! Nice try!'}
              </p>
              <p className="font-semibold text-white/80">
                {GAME_NAMES[result.game]} · {result.got} of {result.total} {result.game === 'sc' ? 'catches' : 'words'}
              </p>
              <p className="text-4xl tracking-wider" aria-label={`${stars} out of 5 stars`}>
                <span className="inline-flex gap-1 justify-center">
                  {[0, 1, 2, 3, 4].map(i => (
                    <Emoji3D key={i} emoji="⭐" className={`w-11 h-11 ${i < stars ? '' : 'opacity-25 grayscale'}`} />
                  ))}
                </span>
              </p>
              <div className="rounded-3xl bg-white/5 border-2 border-white/10 p-4 text-left space-y-2">
                <p className={`${FUN} text-xl font-bold`}>📚 Words you played</p>
                <div className="flex flex-wrap gap-2">
                  {learned.length === 0 ? (
                    <span className="text-white/60">No words this time. Try again!</span>
                  ) : (
                    learned.map(w => (
                      <span key={w.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10">
                        <Emoji3D emoji={w.emoji} className="w-7 h-7" /> <b className="text-[#FFC83D]">{w.word}</b>
                        <span className="text-white/80">{w.en}</span>
                        <ListenButton text={w.word} label="" className="text-sm" />
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => (result.game === 'lc' ? startLC() : result.game === 'wb' ? startWB() : startSC())}
                  className={`${PRESS} ${FUN} py-4 rounded-2xl bg-[#FF6B35] text-xl font-bold border-b-[6px] border-[#D9480F]`}
                >
                  🔁 Play again
                </button>
                <button
                  onClick={goHome}
                  className={`${PRESS} ${FUN} py-4 rounded-2xl bg-white text-[#7E22CE] text-xl font-bold border-b-[6px] border-slate-300`}
                >
                  🍬 All games
                </button>
              </div>
              <button
                onClick={async () => {
                  gameAudio.sfx('tap');
                  const data: ShareData = {
                    title: 'FunlyLearn Word Crush',
                    text: `🍬 I got ${result.got}/${result.total} in ${GAME_NAMES[result.game].slice(3)} on FunlyLearn Word Crush! Can you beat me?`,
                    url: `${window.location.origin}/?invite=word_crush`
                  };
                  if (!(await openNativeShare(data))) setShareData(data);
                }}
                className={`${PRESS} ${FUN} w-full py-4 rounded-2xl bg-[#16A34A] text-xl font-semibold border-b-[6px] border-[#064E3B]`}
              >
                📲 Challenge a friend
              </button>
            </div>
          );
        })()}

        {needsTap && (
          <button
            onClick={handleTapToPlay}
            className={`${PRESS} ${FUN} fixed top-3 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-[#FFC83D] text-[#064E3B] font-bold shadow-xl animate-pulse`}
          >
            🎵 Tap anywhere for music
          </button>
        )}

        <ShareSheet data={shareData} onClose={() => setShareData(null)} />

        {toast && (
          <div className={`${FUN} fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white text-[#7E22CE] font-semibold px-5 py-3 rounded-2xl shadow-xl max-w-xs text-center`}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};
