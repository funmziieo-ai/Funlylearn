import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles, Flame, Trophy, Play, CheckCircle2, RotateCcw,
  Volume2, Heart, Crown, Share2, Award, ArrowRight, RefreshCw, MessageCircle
} from 'lucide-react';
import {
  WORD_CRUSH_VOCABULARY, NIGERIAN_ITEMS, GRANDMA_SCRIPTS,
  CrushWord, NigerianItem
} from '../data/naijaWordCrushData';
import { fetchAudioTTS } from '../services/apiClient';

export interface NaijaWordCrushProps {
  onBackToApp?: () => void;
  isStandalonePreview?: boolean;
}

type GameMode = 'fruit_match' | 'lego_builder' | 'speed_crush';
type Language = 'Yoruba' | 'Igbo' | 'Hausa';

const GRID_SIZE = 6;

export interface LetterCandyItem {
  id: string;
  letter: string;
  phonetics: string;
  color: string;
  borderColor: string;
}

const getLetterItemsForLanguage = (lang: Language): LetterCandyItem[] => {
  const colorStyles = [
    { color: 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white shadow-rose-950/40', border: 'border-rose-200' },
    { color: 'bg-gradient-to-br from-[#005029] via-emerald-600 to-teal-700 text-white shadow-emerald-950/40', border: 'border-emerald-200' },
    { color: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-amber-950/40', border: 'border-amber-200' },
    { color: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-indigo-950/40', border: 'border-blue-200' },
    { color: 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-purple-950/40', border: 'border-purple-200' },
    { color: 'bg-gradient-to-br from-orange-500 via-red-600 to-orange-700 text-white shadow-orange-950/40', border: 'border-orange-200' },
  ];

  let rawList: { letter: string; phonetics: string }[] = [];

  if (lang === 'Yoruba') {
    rawList = [
      { letter: 'A', phonetics: 'Ah' },
      { letter: 'B', phonetics: 'Bii' },
      { letter: 'D', phonetics: 'Dii' },
      { letter: 'E', phonetics: 'Aii' },
      { letter: 'Ẹ', phonetics: 'Eh' },
      { letter: 'F', phonetics: 'Fii' },
      { letter: 'G', phonetics: 'Gii' },
      { letter: 'GB', phonetics: 'Gbi' },
      { letter: 'I', phonetics: 'Eee' },
      { letter: 'J', phonetics: 'Jii' },
      { letter: 'K', phonetics: 'Kii' },
      { letter: 'L', phonetics: 'Lii' },
      { letter: 'M', phonetics: 'Mii' },
      { letter: 'N', phonetics: 'Nii' },
      { letter: 'O', phonetics: 'Oh' },
      { letter: 'Ọ', phonetics: 'Aw' },
      { letter: 'P', phonetics: 'Pii' },
      { letter: 'R', phonetics: 'Rii' },
      { letter: 'S', phonetics: 'Sii' },
      { letter: 'Ṣ', phonetics: 'Shii' },
      { letter: 'T', phonetics: 'Tii' },
      { letter: 'U', phonetics: 'Ooo' },
      { letter: 'W', phonetics: 'Wii' },
      { letter: 'Y', phonetics: 'Yii' },
    ];
  } else if (lang === 'Igbo') {
    rawList = [
      { letter: 'A', phonetics: 'Ah' },
      { letter: 'Ị', phonetics: 'Ih' },
      { letter: 'KP', phonetics: 'Kpa' },
      { letter: 'Ọ', phonetics: 'Aw' },
      { letter: 'Ụ', phonetics: 'Oo' },
      { letter: 'Ṅ', phonetics: 'Nga' },
    ];
  } else {
    // Hausa
    rawList = [
      { letter: 'A', phonetics: 'Ah' },
      { letter: 'Ɓ', phonetics: 'Bha' },
      { letter: 'Ɗ', phonetics: 'Dha' },
      { letter: 'Ƙ', phonetics: 'Kha' },
      { letter: 'TS', phonetics: 'Tsa' },
      { letter: 'Ƴ', phonetics: 'Yha' },
    ];
  }

  return rawList.map((item, idx) => ({
    id: `letter-${lang}-${item.letter}`,
    letter: item.letter,
    phonetics: item.phonetics,
    color: colorStyles[idx % colorStyles.length].color,
    borderColor: colorStyles[idx % colorStyles.length].border,
  }));
};

const getLetterItemsForWord = (targetWord: CrushWord | null, lang: Language): LetterCandyItem[] => {
  const colorStyles = [
    { color: 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white shadow-rose-950/40', border: 'border-rose-200' },
    { color: 'bg-gradient-to-br from-[#005029] via-emerald-600 to-teal-700 text-white shadow-emerald-950/40', border: 'border-emerald-200' },
    { color: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-amber-950/40', border: 'border-amber-200' },
    { color: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-indigo-950/40', border: 'border-blue-200' },
    { color: 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-purple-950/40', border: 'border-purple-200' },
    { color: 'bg-gradient-to-br from-orange-500 via-red-600 to-orange-700 text-white shadow-orange-950/40', border: 'border-orange-200' },
  ];

  const wordLetters: { letter: string; phonetics: string }[] = [];

  if (targetWord && targetWord.word) {
    const rawNormalized = targetWord.word.normalize('NFD').replace(/[\u0300\u0301\u0302\u0304]/g, '').normalize('NFC');
    const str = rawNormalized.toUpperCase();
    const digraphs = ['GB', 'KP', 'TS', 'CH', 'SH', 'GW', 'KW', 'NW', 'NY'];
    const extractedLetters: string[] = [];

    let i = 0;
    while (i < str.length) {
      if (/[\s\-\/\,\.]/.test(str[i])) {
        i++;
        continue;
      }
      let matchedDigraph = false;
      for (const dg of digraphs) {
        if (str.substring(i, i + dg.length) === dg) {
          if (!extractedLetters.includes(dg)) {
            extractedLetters.push(dg);
          }
          i += dg.length;
          matchedDigraph = true;
          break;
        }
      }
      if (!matchedDigraph) {
        const char = str[i];
        if (char && !extractedLetters.includes(char)) {
          extractedLetters.push(char);
        }
        i++;
      }
    }

    extractedLetters.forEach(l => {
      wordLetters.push({
        letter: l,
        phonetics: `'${l}' Sound`,
      });
    });
  }

  const defaults = getLetterItemsForLanguage(lang);
  for (const def of defaults) {
    if (wordLetters.length >= 3) break;
    if (!wordLetters.some(item => item.letter === def.letter)) {
      wordLetters.push({
        letter: def.letter,
        phonetics: def.phonetics,
      });
    }
  }

  return wordLetters.slice(0, 4).map((item, idx) => ({
    id: `letter-${lang}-${item.letter}`,
    letter: item.letter,
    phonetics: item.phonetics,
    color: colorStyles[idx % colorStyles.length].color,
    borderColor: colorStyles[idx % colorStyles.length].border,
  }));
};

interface CandyCell {
  gridKey: string;
  item: LetterCandyItem;
  isCrushing?: boolean;
}

const createRandomCandyGrid = (letterItems: LetterCandyItem[]): CandyCell[][] => {
  const newGrid: CandyCell[][] = [];
  const palette = letterItems && letterItems.length > 0 ? letterItems : getLetterItemsForLanguage('Yoruba');
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: CandyCell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let available = [...palette];
      if (r >= 2) {
        const id1 = newGrid[r - 1][c].item.id;
        const id2 = newGrid[r - 2][c].item.id;
        if (id1 === id2) {
          available = available.filter(i => i.id !== id1);
        }
      }
      if (c >= 2) {
        const id1 = row[c - 1].item.id;
        const id2 = row[c - 2].item.id;
        if (id1 === id2) {
          available = available.filter(i => i.id !== id1);
        }
      }
      const item = available[Math.floor(Math.random() * available.length)] || palette[0];
      row.push({
        gridKey: `cell-${r}-${c}-${Math.random()}`,
        item,
      });
    }
    newGrid.push(row);
  }

  return newGrid;
};

const findGridMatches = (grid: CandyCell[][]): { r: number; c: number }[] => {
  if (!grid || grid.length < GRID_SIZE) return [];
  const matchedSet = new Set<string>();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      if (!grid[r] || !grid[r][c] || !grid[r][c + 1] || !grid[r][c + 2]) continue;
      const id1 = grid[r][c].item.id;
      const id2 = grid[r][c + 1].item.id;
      const id3 = grid[r][c + 2].item.id;
      if (id1 === id2 && id2 === id3) {
        matchedSet.add(`${r},${c}`);
        matchedSet.add(`${r},${c + 1}`);
        matchedSet.add(`${r},${c + 2}`);
      }
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      if (!grid[r] || !grid[r + 1] || !grid[r + 2]) continue;
      const id1 = grid[r][c].item.id;
      const id2 = grid[r + 1][c].item.id;
      const id3 = grid[r + 2][c].item.id;
      if (id1 === id2 && id2 === id3) {
        matchedSet.add(`${r},${c}`);
        matchedSet.add(`${r + 1},${c}`);
        matchedSet.add(`${r + 2},${c}`);
      }
    }
  }

  const matches: { r: number; c: number }[] = [];
  matchedSet.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    matches.push({ r, c });
  });
  return matches;
};

export const NaijaWordCrush: React.FC<NaijaWordCrushProps> = ({
  onBackToApp,
  isStandalonePreview = true
}) => {
  const [mode, setMode] = useState<GameMode>('fruit_match');
  const [language, setLanguage] = useState<Language>('Yoruba');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('naija_word_crush_highscore') || '0', 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [comboCount, setComboCount] = useState<number>(0);

  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [showGrandmaScript, setShowGrandmaScript] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Swap adjacent fruits to match 3 in a row!');
  const [shakingItemId, setShakingItemId] = useState<string | null>(null);

  const [fruitTargetWord, setFruitTargetWord] = useState<CrushWord | null>(null);
  const [candyGrid, setCandyGrid] = useState<CandyCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessingMatch, setIsProcessingMatch] = useState<boolean>(false);

  const [builderDifficulty, setBuilderDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [builderWord, setBuilderWord] = useState<CrushWord | null>(null);
  const [jumbledBlocks, setJumbledBlocks] = useState<{ id: string; letter: string }[]>([]);
  const [placedSlots, setPlacedSlots] = useState<(string | null)[]>([]);

  const [speedTarget, setSpeedTarget] = useState<CrushWord | null>(null);
  const [fallingItems, setFallingItems] = useState<
    { id: string; word: CrushWord; top: number; left: number; speed: number }[]
  >([]);
  const [speedScore, setSpeedScore] = useState<number>(0);
  const speedLoopRef = useRef<number | null>(null);

  // Web Audio Synth for Custom Sound Effects
  const playSynthSound = useCallback((type: 'pop' | 'click' | 'crush' | 'win' | 'wrong' | 'splash') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'splash') {
        // Layered noise burst + quick pitch-drop tone for a juicy, satisfying
        // "splash" feel on every match, instead of a thin single-tone beep.
        const now = ctx.currentTime;

        const bufferSize = ctx.sampleRate * 0.25;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        noiseFilter.Q.value = 0.8;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);
        noiseSource.stop(now + 0.25);

        const tone = ctx.createOscillator();
        const toneGain = ctx.createGain();
        tone.connect(toneGain);
        toneGain.connect(ctx.destination);
        tone.type = 'sine';
        tone.frequency.setValueAtTime(700, now);
        tone.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        toneGain.gain.setValueAtTime(0.25, now);
        toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        tone.start(now);
        tone.stop(now + 0.18);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'crush') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio fallback
    }
  }, []);

  const speakWord = async (text: string) => {
    try {
      const res = await fetchAudioTTS(text, language === 'Yoruba' ? 'yo' : 'en');
      if (res.audioBase64) {
        const audio = new Audio(res.audioBase64);
        await audio.play();
        return;
      }
    } catch (_err) {
      // Fallback below
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredWords = useMemo(
    () => WORD_CRUSH_VOCABULARY.filter(w => w.language === language),
    [language]
  );

  const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  const processGridCascades = useCallback((
    gridToProcess: CandyCell[][],
    currentScore: number,
    targetWord: CrushWord | null
  ) => {
    const matches = findGridMatches(gridToProcess);
    if (matches.length === 0) {
      setIsProcessingMatch(false);
      return;
    }

    const newGrid = gridToProcess.map(row => row.map(cell => ({ ...cell })));
    const matchedLetterNames = new Set<string>();

    matches.forEach(({ r, c }) => {
      newGrid[r][c].isCrushing = true;
      if (newGrid[r][c].item?.letter) {
        matchedLetterNames.add(newGrid[r][c].item.letter);
      }
    });

    setCandyGrid(newGrid);
    playSynthSound('splash');

    // Visual splash burst on EVERY match now, not just 4+ combos —
    // small for a simple 3-match, bigger for larger ones.
    confetti({
      particleCount: matches.length >= 4 ? 50 : 22,
      spread: matches.length >= 4 ? 60 : 40,
      startVelocity: 28,
      origin: { y: 0.55 },
      colors: ['#00A651', '#FFC107', '#FF6B35', '#ffffff']
    });

    const firstLetter = Array.from(matchedLetterNames)[0];
    if (firstLetter) {
      speakWord(firstLetter);
    }

    const pointsEarned = matches.length * 10 + (matches.length >= 4 ? 30 : 0);
    const updatedScore = currentScore + pointsEarned;
    setScore(updatedScore);
    if (updatedScore > highScore) {
      setHighScore(updatedScore);
      localStorage.setItem('naija_word_crush_highscore', updatedScore.toString());
    }

    const comboPhrases = [
      'LETTER CRUSH! 🍬', 'EXCELLENT! 🇳🇬', 'O SE DAADAA! 🎉', 'GENIUS! ✨', 'TASTY MATCH! 🌟'
    ];
    const phrase = comboPhrases[Math.floor(Math.random() * comboPhrases.length)];
    setFeedbackMessage(`${phrase} ${firstLetter ? `'${firstLetter}'` : ''} +${pointsEarned} Pts!`);

    setTimeout(() => {
      const droppedGrid: CandyCell[][] = Array.from({ length: GRID_SIZE }, () => []);
      const letterItems = getLetterItemsForWord(targetWord, language);

      for (let c = 0; c < GRID_SIZE; c++) {
        const remainingCells: CandyCell[] = [];
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (!newGrid[r][c].isCrushing) {
            remainingCells.unshift(newGrid[r][c]);
          }
        }
        const missingCount = GRID_SIZE - remainingCells.length;
        const newCells: CandyCell[] = [];
        for (let i = 0; i < missingCount; i++) {
          const randItem = letterItems[Math.floor(Math.random() * letterItems.length)];
          newCells.push({
            gridKey: `cell-new-${Date.now()}-${c}-${i}-${Math.random()}`,
            item: randItem,
          });
        }
        const fullCol = [...newCells, ...remainingCells];
        for (let r = 0; r < GRID_SIZE; r++) {
          droppedGrid[r][c] = fullCol[r];
        }
      }

      setCandyGrid(droppedGrid);

      setTimeout(() => {
        const cascadeMatches = findGridMatches(droppedGrid);
        if (cascadeMatches.length > 0) {
          processGridCascades(droppedGrid, updatedScore, targetWord);
        } else {
          setIsProcessingMatch(false);
          if (updatedScore >= level * 60) {
            setLevel(prev => prev + 1);
            setShowLevelComplete(true);
          }
        }
      }, 250);
    }, 300);
  }, [playSynthSound, highScore, level, language]);

  const initFruitMatch = useCallback(() => {
    if (filteredWords.length === 0) return;
    const target = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    setFruitTargetWord(target);

    const letterItems = getLetterItemsForWord(target, language);
    const grid = createRandomCandyGrid(letterItems);
    setCandyGrid(grid);
    setSelectedCell(null);
    setIsProcessingMatch(false);
    setFeedbackMessage(`Swipe or tap adjacent letters to match '${target.word}'! 🍬`);
  }, [filteredWords, language]);

  const initLegoBuilder = useCallback(() => {
    const candidates = filteredWords.filter(w => {
      const len = w.word.replace(/\s+/g, '').length;
      if (builderDifficulty === 'easy') return len <= 4;
      if (builderDifficulty === 'medium') return len > 4 && len <= 6;
      return len > 6;
    });

    const target = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : filteredWords[Math.floor(Math.random() * filteredWords.length)];

    setBuilderWord(target);

    const letters = target.word.toUpperCase().replace(/[^A-Z]/g, '').split('');
    const jumbled = letters
      .map((l, idx) => ({ id: `${l}-${idx}-${Math.random()}`, letter: l }))
      .sort(() => 0.5 - Math.random());

    setJumbledBlocks(jumbled);
    setPlacedSlots(new Array(letters.length).fill(null));
    setFeedbackMessage(`Spell "${target.word}" (${target.english}) in Lego blocks!`);
    speakWord(target.word);
  }, [filteredWords, builderDifficulty]);

  const initSpeedCrush = useCallback(() => {
    if (filteredWords.length === 0) return;
    const target = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    setSpeedTarget(target);
    setFallingItems([]);
    setFeedbackMessage(`Tap the falling fruit that means "${target.english}"!`);
  }, [filteredWords]);

  useEffect(() => {
    setLives(3);
    setStreak(0);
    setComboCount(0);
    setShowGameOver(false);
    setShowLevelComplete(false);

    if (mode === 'fruit_match') {
      initFruitMatch();
    } else if (mode === 'lego_builder') {
      initLegoBuilder();
    } else if (mode === 'speed_crush') {
      initSpeedCrush();
    }
  }, [mode, language, builderDifficulty, initFruitMatch, initLegoBuilder, initSpeedCrush]);

  const executeSwap = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessingMatch || showGameOver || showLevelComplete) return;

    setIsProcessingMatch(true);
    setSelectedCell(null);

    const swappedGrid = candyGrid.map(row => row.map(cell => ({ ...cell })));
    const temp = swappedGrid[r1][c1];
    swappedGrid[r1][c1] = swappedGrid[r2][c2];
    swappedGrid[r2][c2] = temp;

    const matches = findGridMatches(swappedGrid);

    if (matches.length > 0) {
      setCandyGrid(swappedGrid);
      processGridCascades(swappedGrid, score, fruitTargetWord);
    } else {
      playSynthSound('wrong');
      setShakingItemId(`${r1}-${c1}`);
      setFeedbackMessage('No match! Swipe adjacent letters to match 3 in a row! 🍬');
      setTimeout(() => setShakingItemId(null), 500);
      setIsProcessingMatch(false);
    }
  }, [isProcessingMatch, showGameOver, showLevelComplete, candyGrid, score, fruitTargetWord, processGridCascades, playSynthSound]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (isProcessingMatch || showGameOver || showLevelComplete) return;
    touchStartRef.current = { r, c, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (r: number, c: number, e: React.PointerEvent) => {
    if (!touchStartRef.current || isProcessingMatch || showGameOver || showLevelComplete) return;
    const { r: rStart, c: cStart, x: xStart, y: yStart } = touchStartRef.current;

    const dx = e.clientX - xStart;
    const dy = e.clientY - yStart;
    const dist = Math.hypot(dx, dy);

    if (dist >= 6) {
      let targetR = rStart;
      let targetC = cStart;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 6 && cStart < GRID_SIZE - 1) targetC = cStart + 1;
        else if (dx < -6 && cStart > 0) targetC = cStart - 1;
      } else {
        if (dy > 6 && rStart < GRID_SIZE - 1) targetR = rStart + 1;
        else if (dy < -6 && rStart > 0) targetR = rStart - 1;
      }

      if (targetR !== rStart || targetC !== cStart) {
        touchStartRef.current = null;
        executeSwap(rStart, cStart, targetR, targetC);
      }
    }
  };

  const handlePointerUp = (r: number, c: number, e: React.PointerEvent) => {
    if (!touchStartRef.current) return;
    const { r: rStart, c: cStart, x: xStart, y: yStart } = touchStartRef.current;
    touchStartRef.current = null;

    const dx = e.clientX - xStart;
    const dy = e.clientY - yStart;
    const dist = Math.hypot(dx, dy);

    if (dist < 6) {
      if (!selectedCell) {
        setSelectedCell({ r: rStart, c: cStart });
        playSynthSound('click');
      } else {
        const { r: r1, c: c1 } = selectedCell;
        if (r1 === rStart && c1 === cStart) {
          setSelectedCell(null);
        } else if (Math.abs(r1 - rStart) + Math.abs(c1 - cStart) === 1) {
          executeSwap(r1, c1, rStart, cStart);
        } else {
          setSelectedCell({ r: rStart, c: cStart });
          playSynthSound('click');
        }
      }
      return;
    }

    let targetR = rStart;
    let targetC = cStart;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 6 && cStart < GRID_SIZE - 1) targetC = cStart + 1;
      else if (dx < -6 && cStart > 0) targetC = cStart - 1;
    } else {
      if (dy > 6 && rStart < GRID_SIZE - 1) targetR = rStart + 1;
      else if (dy < -6 && rStart > 0) targetR = rStart - 1;
    }

    if (targetR !== rStart || targetC !== cStart) {
      executeSwap(rStart, cStart, targetR, targetC);
    }
  };

  const handleShuffleCandyGrid = () => {
    playSynthSound('pop');
    const letterItems = getLetterItemsForWord(fruitTargetWord, language);
    const newG = createRandomCandyGrid(letterItems);
    setCandyGrid(newG);
    setSelectedCell(null);
    setFeedbackMessage('Board shuffled! Swipe letters to match 3 in a row! 🔄');
  };

  const handleLegoBlockTap = (block: { id: string; letter: string }) => {
    if (!builderWord) return;

    const emptyIdx = placedSlots.findIndex(s => s === null);
    if (emptyIdx === -1) return;

    playSynthSound('click');
    const newPlaced = [...placedSlots];
    newPlaced[emptyIdx] = block.letter;
    setPlacedSlots(newPlaced);

    setJumbledBlocks(prev => prev.filter(b => b.id !== block.id));

    if (emptyIdx === placedSlots.length - 1) {
      const spelledWord = newPlaced.join('');
      const targetClean = builderWord.word.toUpperCase().replace(/[^A-Z]/g, '');

      if (spelledWord === targetClean) {
        playSynthSound('win');
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        speakWord(builderWord.word);

        const earned = 20;
        const newScore = score + earned;
        setScore(newScore);
        setFeedbackMessage(`🧱 You built "${builderWord.word}"! O dara pupo! 🎉`);

        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('naija_word_crush_highscore', newScore.toString());
        }

        setTimeout(() => {
          if (newScore >= level * 50) {
            setLevel(prev => prev + 1);
            setShowLevelComplete(true);
          } else {
            initLegoBuilder();
          }
        }, 1500);
      } else {
        playSynthSound('wrong');
        setFeedbackMessage('Oops! Let us try building again!');
        setTimeout(() => {
          initLegoBuilder();
        }, 1200);
      }
    }
  };

  const handleRemovePlacedSlot = (index: number) => {
    const letterToReturn = placedSlots[index];
    if (!letterToReturn) return;

    playSynthSound('click');
    const newPlaced = [...placedSlots];
    newPlaced[index] = null;
    setPlacedSlots(newPlaced);

    setJumbledBlocks(prev => [...prev, { id: `${letterToReturn}-${Date.now()}`, letter: letterToReturn }]);
  };

  useEffect(() => {
    if (mode !== 'speed_crush' || showGameOver || showLevelComplete || !speedTarget) return;

    const interval = setInterval(() => {
      const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
      const newItem = {
        id: `fall-${Date.now()}-${Math.random()}`,
        word: randomWord,
        top: 0,
        left: Math.floor(Math.random() * 70) + 15,
        speed: 3 + level * 0.5
      };

      setFallingItems(prev => [...prev, newItem]);
    }, 2200);

    return () => clearInterval(interval);
  }, [mode, showGameOver, showLevelComplete, speedTarget, filteredWords, level]);

  useEffect(() => {
    if (mode !== 'speed_crush' || showGameOver || showLevelComplete) return;

    let animId: number;
    let lastTime = performance.now();

    const update = (time: number) => {
      if (time - lastTime > 40) {
        lastTime = time;
        setFallingItems(prev => {
          if (prev.length === 0) return prev;
          let missedTarget = false;
          const nextItems: typeof prev = [];

          for (const item of prev) {
            const newTop = item.top + item.speed;
            if (newTop > 85) {
              if (speedTarget && item.word.id === speedTarget.id) {
                missedTarget = true;
              }
            } else {
              nextItems.push({ ...item, top: newTop });
            }
          }

          if (missedTarget) {
            setLives(l => {
              const nextL = l - 1;
              if (nextL <= 0) setShowGameOver(true);
              return nextL;
            });
            playSynthSound('wrong');
            if (speedTarget) {
              setFeedbackMessage(`Eya! You missed "${speedTarget.word}"!`);
            }
          }

          return nextItems;
        });
      }
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [mode, showGameOver, showLevelComplete, speedTarget, playSynthSound]);

  const handleTapFallingItem = (item: { id: string; word: CrushWord }) => {
    if (!speedTarget) return;

    if (item.word.id === speedTarget.id) {
      playSynthSound('splash');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      speakWord(item.word.word);

      const newScore = score + 15;
      setScore(newScore);
      setSpeedScore(s => s + 1);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('naija_word_crush_highscore', newScore.toString());
      }

      setFallingItems(prev => prev.filter(i => i.id !== item.id));
      setFeedbackMessage(`⚡ Great speed crush! "${item.word.word}" = ${item.word.english}!`);
      setTimeout(initSpeedCrush, 800);
    } else {
      playSynthSound('wrong');
      setLives(l => {
        const nextL = l - 1;
        if (nextL <= 0) setShowGameOver(true);
        return nextL;
      });
    }
  };

  const getBlockColor = (letter: string) => {
    const l = letter.toUpperCase();
    if (l === 'A') return 'bg-red-500 text-white border-red-700 shadow-red-700/50';
    if (l === 'E') return 'bg-blue-500 text-white border-blue-700 shadow-blue-700/50';
    if (l === 'I') return 'bg-emerald-500 text-white border-emerald-700 shadow-emerald-700/50';
    if (l === 'O') return 'bg-amber-400 text-slate-950 border-amber-600 shadow-amber-600/50';
    if (l === 'U') return 'bg-purple-600 text-white border-purple-800 shadow-purple-800/50';
    return 'bg-slate-100 text-slate-900 border-slate-300 shadow-slate-300/50';
  };

  const handleShareWhatsApp = () => {
    const text = `🏆 I scored ${score} Points in Naija Word Crush on Mama Titi AI! 🇳🇬 Can you beat my high score in Yoruba, Igbo & Hausa? Challenge me here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareGrandma = (script: { yo: string; en: string }) => {
    const text = `🇳🇬 Hi Grandma! Here is my message in ${language}:\n\n"${script.yo}"\n(${script.en})\n\nSent with love from Mama Titi AI Scholar! 🌟`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FDF6EC] text-slate-900 font-jakarta flex flex-col relative overflow-hidden pb-12">
      
      {isStandalonePreview && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 font-bold text-xs flex items-center justify-between border-b-2 border-amber-500 shadow-xs z-50">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 font-extrabold uppercase text-[10px]">
              Standalone Preview
            </span>
            <span>Naija Word Crush 🎮 (Testing Mode)</span>
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 text-amber-300 text-[11px] font-bold transition-all"
            >
              ← Return to Main App
            </button>
          )}
        </div>
      )}

      <header className="bg-[#005029] text-white p-3.5 sm:p-4 shadow-lg border-b-4 border-amber-400 shrink-0">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-[#023319] px-2.5 py-1 rounded-full border border-amber-400/30">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 transition-all ${
                    i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-600 fill-slate-700 scale-90'
                  }`}
                />
              ))}
            </div>
            {streak > 0 && (
              <div className="flex items-center space-x-1 bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-amber-950" />
                <span>x{streak}</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="font-serif font-extrabold text-base sm:text-lg text-amber-300 flex items-center space-x-1 justify-center">
              <span>Naija Word Crush 🌍</span>
            </h1>
            <span className="text-[10px] text-emerald-200 block font-medium">Level {level}</span>
          </div>

          <div className="flex items-center space-x-1 bg-[#023319] px-3 py-1 rounded-full border border-amber-400/40 text-amber-300 font-extrabold text-xs">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>⭐ {score}</span>
          </div>

        </div>

        <div className="max-w-xl mx-auto mt-2.5 flex items-center justify-between gap-2 border-t border-emerald-800/80 pt-2">
          <div className="flex items-center space-x-1">
            {(['Yoruba', 'Igbo', 'Hausa'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-full font-bold text-xs transition-all ${
                  language === lang
                    ? lang === 'Yoruba'
                      ? 'bg-[#005029] text-emerald-100 border-2 border-emerald-400 shadow-md scale-105'
                      : lang === 'Igbo'
                      ? 'bg-[#6B2FA0] text-purple-100 border-2 border-purple-300 shadow-md scale-105'
                      : 'bg-[#F5A623] text-slate-950 border-2 border-amber-200 shadow-md scale-105'
                    : 'bg-[#023319] text-emerald-200/80 hover:bg-emerald-900 border border-emerald-700/50'
                }`}
              >
                {lang === 'Yoruba' ? '🟢 Yoruba' : lang === 'Igbo' ? '🟣 Igbo' : '🟡 Hausa'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowGrandmaScript(true)}
            className="px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] shadow-xs flex items-center space-x-1"
          >
            <span>👵 Grandma Script</span>
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto w-full px-3 pt-3">
        <div className="bg-amber-100/80 p-1 rounded-2xl border border-amber-300/80 grid grid-cols-3 gap-1 text-center font-bold text-xs">
          <button
            onClick={() => setMode('fruit_match')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'fruit_match'
                ? 'bg-[#005029] text-amber-300 shadow-md font-extrabold'
                : 'text-slate-700 hover:bg-amber-200/60'
            }`}
          >
            🔤 Letter Match
          </button>
          <button
            onClick={() => setMode('lego_builder')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'lego_builder'
                ? 'bg-[#005029] text-amber-300 shadow-md font-extrabold'
                : 'text-slate-700 hover:bg-amber-200/60'
            }`}
          >
            🧱 Lego Builder
          </button>
          <button
            onClick={() => setMode('speed_crush')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'speed_crush'
                ? 'bg-[#005029] text-amber-300 shadow-md font-extrabold'
                : 'text-slate-700 hover:bg-amber-200/60'
            }`}
          >
            ⚡ Speed Crush
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-3 mt-3">
        <div className="p-3 rounded-2xl bg-white border-2 border-amber-300 shadow-soft text-center font-bold text-xs text-slate-800 flex items-center justify-center space-x-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      </div>

      <main className="max-w-xl mx-auto w-full px-3 mt-3 flex-1 flex flex-col justify-center">
        
        {mode === 'fruit_match' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="bg-gradient-to-r from-[#005029] via-[#026837] to-[#005029] p-3 sm:p-4 rounded-3xl border-2 border-amber-300 shadow-xl text-white text-center space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                  {language} Alphabet Crush 🍬
                </span>
                <button
                  onClick={handleShuffleCandyGrid}
                  className="px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] shadow-sm flex items-center space-x-1 active:scale-95 transition-transform"
                  title="Shuffle Letter Grid"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-0.5">
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-300 drop-shadow-sm">
                  {language} Letter Match
                </h2>
                {fruitTargetWord && (
                  <button
                    onClick={() => speakWord(fruitTargetWord.word)}
                    className="p-1.5 rounded-full bg-amber-400/30 text-amber-200 hover:bg-amber-400/50 transition-colors"
                    title={`Listen to target word: ${fruitTargetWord.word}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-emerald-100">
                {fruitTargetWord ? `Word Goal: "${fruitTargetWord.word}" (${fruitTargetWord.english}) • ` : ''}
                Swipe adjacent letters to match 3 in a row! 🍬
              </p>
            </div>

            <div className="bg-slate-900/90 p-2 sm:p-3 rounded-3xl border-4 border-amber-400 shadow-2xl relative touch-none select-none">
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5 justify-center">
                {candyGrid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                    const isShaking = shakingItemId === `${rIdx}-${cIdx}`;
                    const isCrushing = cell.isCrushing;

                    return (
                      <button
                        key={cell.gridKey || `${rIdx}-${cIdx}`}
                        onPointerDown={(e) => handlePointerDown(rIdx, cIdx, e)}
                        onPointerMove={(e) => handlePointerMove(rIdx, cIdx, e)}
                        onPointerUp={(e) => handlePointerUp(rIdx, cIdx, e)}
                        className={`h-13 sm:h-16 w-full rounded-2xl border-2 sm:border-3 flex flex-col items-center justify-center p-0.5 shadow-lg active:scale-95 transition-all relative overflow-hidden select-none touch-none ${
                          cell.item.color
                        } ${cell.item.borderColor} ${
                          isSelected
                            ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900 scale-105 z-10 animate-pulse border-white'
                            : 'hover:scale-105'
                        } ${isShaking ? 'animate-bounce border-rose-500' : ''} ${
                          isCrushing ? 'scale-125 opacity-0 transition-all duration-300 rotate-12' : ''
                        }`}
                      >
                        <span className="font-serif font-black text-xl sm:text-2xl leading-none drop-shadow-md tracking-tight">
                          {cell.item.letter}
                        </span>
                        <span className="font-sans font-bold text-[9px] sm:text-[10px] leading-tight text-amber-100/90 drop-shadow-sm mt-0.5">
                          {cell.item.phonetics}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 text-center text-[10px] sm:text-xs font-bold text-amber-200/90 flex items-center justify-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Swipe finger/mouse on any letter block to swap & match 3 in a row! 🍬</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'lego_builder' && builderWord && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-center space-x-2 text-xs font-bold">
              <span className="text-slate-500">Difficulty:</span>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setBuilderDifficulty(d)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] font-extrabold ${
                    builderDifficulty === d
                      ? 'bg-[#005029] text-amber-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-purple-300 shadow-md text-center space-y-1">
              <div className="text-4xl mb-1">{builderWord.itemEmoji}</div>
              <h3 className="font-serif font-bold text-lg text-slate-800">
                "{builderWord.english}"
              </h3>
              <p className="text-xs text-slate-500">
                Tap the chunky Lego blocks below to spell the word!
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-950 border-4 border-amber-400 shadow-inner flex flex-wrap items-center justify-center gap-2 min-h-[90px]">
              {placedSlots.map((slot, idx) => (
                <button
                  key={`slot-${idx}`}
                  onClick={() => handleRemovePlacedSlot(idx)}
                  className={`w-12 h-14 rounded-2xl border-b-4 flex items-center justify-center font-extrabold text-xl font-mono shadow-lg transition-all ${
                    slot
                      ? getBlockColor(slot)
                      : 'border-slate-800 bg-slate-900/80 text-slate-700'
                  }`}
                >
                  {slot || '_'}
                </button>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-md">
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase text-center mb-2">
                Available Lego Letters
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {jumbledBlocks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleLegoBlockTap(b)}
                    className={`w-12 h-14 rounded-2xl border-b-4 flex items-center justify-center font-extrabold text-xl font-mono shadow-md hover:scale-110 active:scale-95 transition-all ${getBlockColor(
                      b.letter
                    )}`}
                  >
                    {b.letter}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {mode === 'speed_crush' && speedTarget && (
          <div className="relative h-96 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950 rounded-3xl border-4 border-amber-400 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            
            <div className="bg-amber-400 text-slate-950 p-2.5 px-4 rounded-2xl text-center font-extrabold text-xs shadow-md z-10">
              ⚡ Tap falling fruit that means: <span className="text-base font-serif uppercase block text-emerald-950">"{speedTarget.english}"</span>
            </div>

            <div className="relative flex-1">
              {fallingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTapFallingItem(item)}
                  style={{ top: `${item.top}%`, left: `${item.left}%` }}
                  className="absolute transform -translate-x-1/2 p-2 px-3.5 rounded-2xl bg-white/95 border-2 border-amber-400 shadow-xl flex items-center space-x-1.5 font-bold text-xs text-slate-900 active:scale-125 transition-transform animate-pulse"
                >
                  <span className="text-2xl">{item.word.itemEmoji}</span>
                  <span className="font-serif font-extrabold text-[#005029]">{item.word.word}</span>
                </button>
              ))}
            </div>

            <div className="w-full h-3 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 rounded-full animate-pulse shadow-rose-500/50 shadow-lg z-10" />
          </div>
        )}

      </main>

      <footer className="max-w-xl mx-auto w-full px-3 mt-4">
        <div className="bg-[#005029] text-white p-3 rounded-2xl shadow-md border border-amber-400/40 flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xl shadow-xs border-2 border-white">
              🇳🇬
            </div>
            <div>
              <span className="font-serif font-bold text-xs text-amber-300 block">Mama Titi Says:</span>
              <p className="text-[11px] text-emerald-100 font-medium">
                "{comboCount >= 2 ? 'Ehhh! O se daadaa!' : 'Keep crushing those Nigerian words!'}"
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-emerald-200 block">High Score</span>
            <span className="font-extrabold text-sm text-amber-300">🏆 {highScore}</span>
          </div>

        </div>
      </footer>

      {showLevelComplete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl border-4 border-amber-400 shadow-2xl p-6 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto text-3xl shadow-lg">
              🎉
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-2xl text-[#005029]">
                Level {level - 1} Complete!
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                O dara pupo! You are mastering Nigerian vocabulary!
              </p>
            </div>

            <div className="flex justify-center space-x-2 text-3xl text-amber-400">
              ⭐⭐⭐
            </div>

            <button
              onClick={() => {
                setShowLevelComplete(false);
                if (mode === 'fruit_match') initFruitMatch();
                if (mode === 'lego_builder') initLegoBuilder();
                if (mode === 'speed_crush') initSpeedCrush();
              }}
              className="w-full py-3 rounded-2xl bg-[#005029] hover:bg-[#023319] text-amber-300 font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue to Level {level}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showGameOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl border-4 border-rose-500 shadow-2xl p-6 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-3xl">
              💪
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-xl text-slate-900">
                Eya! Let us try again!
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                "Tun gbiyanju! You can do it!" — Mama Titi 🌟
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-slate-800">
              Total Score Earned: <span className="text-[#005029] font-extrabold text-base">⭐ {score}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setLives(3);
                  setScore(0);
                  setShowGameOver(false);
                  if (mode === 'fruit_match') initFruitMatch();
                  if (mode === 'lego_builder') initLegoBuilder();
                  if (mode === 'speed_crush') initSpeedCrush();
                }}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Score on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGrandmaScript && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border-4 border-amber-400 shadow-2xl overflow-hidden font-jakarta animate-scaleUp">
            
            <div className="bg-[#005029] text-white p-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👵</span>
                <div>
                  <h3 className="font-serif font-bold text-base text-amber-300">
                    Grandma Script Unlocked!
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Say these sweet words to Grandma in {language}!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGrandmaScript(false)}
                className="p-1 rounded-full bg-emerald-950 text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              {GRANDMA_SCRIPTS[language].map((script, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-serif font-extrabold text-sm text-[#005029] block">
                      "{script.yo}"
                    </span>
                    <span className="text-xs text-slate-600 font-medium block">
                      ({script.en})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => speakWord(script.yo)}
                      className="p-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareGrandma(script)}
                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                      title="Send to Grandma on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowGrandmaScript(false)}
                className="w-full py-3 rounded-2xl bg-[#005029] text-amber-300 font-extrabold text-xs shadow-md mt-2"
              >
                Got It! Back to Game
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
