import React, { useState, useRef } from 'react';
import { Volume2, Pause, Loader2, AlertCircle, Sparkles, Flame, Play, CheckCircle2, RotateCcw, Share2, MessageCircle, Lock, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { NAIJA_LINGO_WORDS, LINGO_QUIZZES } from '../data/naijaLingoData';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
import { SyncedReadAlong } from '../components/SyncedReadAlong';
import { fetchAudioTTS } from '../services/apiClient';
import { LINGO_LEVELS, getUnlockedLevels, getNextLockedLevel, getCoinsToNextLevel } from '../utils/coinsSystem';

interface NaijaLingoPageProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenWordCrushPreview?: () => void;
}

// Connects each level to the word/quiz categories it unlocks.
// Level 1 (Beginner, free) gets a small curated starter set rather than
// the full Greetings list, so Level 2 still feels like real progress.
const LEVEL_STARTER_WORD_IDS = ['l1', 'l4', 'l5', 'l8'];

const LEVEL_CATEGORY_MAP: Record<number, string[]> = {
  1: [], // handled via LEVEL_STARTER_WORD_IDS instead of a category
  2: ['Greetings'],
  3: ['Food'],
  4: ['Family'],
  5: ['School'],
  6: [], // Animals — no vocabulary written yet, handled as an empty state
  7: ['Numbers'],
  8: ['Wisdom'],
};

// Word Crush isn't in LINGO_LEVELS since it's a different game format,
// but it should still be a real gate, not a permanently-open preview.
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

const YorubaListenButton: React.FC<{ text: string; label?: string; className?: string }> = ({
  text,
  label = 'Listen',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlaying(false);
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const res = await fetchAudioTTS(text, 'yo');
      if (res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setPlaying(false);
          audioRef.current = null;
          URL.revokeObjectURL(res.audioUrl!);
        };
        audio.onerror = () => {
          setPlaying(false);
          setLoading(false);
          setError(true);
        };
        await audio.play();
        setLoading(false);
        setPlaying(true);
        return;
      }
    } catch (_err) {
      // Real voice failed — no browser voice fallback, fail honestly
      // instead, matching the same standard everywhere else in the app.
    }
    setLoading(false);
    setPlaying(false);
    setError(true);
  };

  if (error) {
    return (
      <button
        onClick={handlePlay}
        className="inline-flex items-center space-x-1 text-[11px] font-jakarta font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-full transition-all"
      >
        <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
        <span>Try again</span>
        <RotateCcw className="w-3 h-3 text-rose-500" />
      </button>
    );
  }

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className={
        'inline-flex items-center space-x-1.5 rounded-full font-jakarta font-bold transition-all hover:scale-105 active:scale-95 ' +
        (playing
          ? 'bg-[#FF6B35] text-white px-3 py-1 text-xs animate-pulse'
          : 'bg-emerald-100 hover:bg-emerald-200 text-[#064E3B] px-2.5 py-1 text-xs border border-emerald-300') +
        ' ' + className
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#064E3B]" />
          <span className="text-[11px]">Loading...</span>
        </>
      ) : playing ? (
        <>
          <Pause className="w-3.5 h-3.5 text-amber-200" />
          <span>Speaking...</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#064E3B]" />
          <span>{label} 🔊</span>
        </>
      )}
    </button>
  );
};

export const NaijaLingoPage: React.FC<NaijaLingoPageProps> = ({
  profile,
  onProfileUpdate,
  onOpenWordCrushPreview
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'words' | 'game'>('levels');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const userCoins = profile.coins || 0;
  const isWordCrushUnlocked = userCoins >= WORD_CRUSH_UNLOCK_COINS;

  const currentLevel = LINGO_LEVELS.find(l => l.id === selectedLevel) || LINGO_LEVELS[0];
  const levelWords = getWordsForLevel(selectedLevel);
  const levelQuizzes = getQuizzesForLevel(selectedLevel);
  const wordOfTheDay = levelWords[0];
  const quiz = levelQuizzes[currentQuizIndex] || levelQuizzes[0];

  const nextLockedLevel = getNextLockedLevel(userCoins);
  const coinsToNext = getCoinsToNextLevel(userCoins);

  const handleShareOnWhatsApp = () => {
    const shareText =
      'I am playing Naija Lingo on FunlyLearn with Mama Titi! My score is ' +
      score +
      ' Stars! Can you beat me? Join here: ' +
      window.location.href;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText), '_blank');
  };

  const handlePlayLevel = (levelId: number) => {
    setSelectedLevel(levelId);
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setActiveTab('words');
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !quiz) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === quiz.correctAnswer) {
      setScore(s => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

      const newCoins = userCoins + 10;
      const newStreak = (profile.correctStreak || 0) + 1;
      const streakBonus = newStreak % 3 === 0 ? 20 : 0;

      onProfileUpdate({
        ...profile,
        stars: profile.stars + 20,
        coins: newCoins + streakBonus,
        correctStreak: newStreak
      });
    }
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < levelQuizzes.length - 1) {
      setCurrentQuizIndex(i => i + 1);
    } else {
      setCurrentQuizIndex(0);
    }
    setSelectedOption(null);
    setIsAnswered(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-24 font-sans">

      {/* Header Banner */}
      <div className="bg-[#5B21B6] text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">🌍</span>
            <div>
              <h1 className="font-serif text-2xl font-bold">Naija Lingo</h1>
              <p className="text-xs text-purple-200">Learn Nigerian Languages with Mama Titi</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareOnWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs font-jakarta font-bold shadow-md transition-all border border-emerald-300"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Friends</span>
              <span className="sm:hidden">Invite</span>
            </button>
            <div className="bg-purple-900/80 border border-purple-400/30 px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
              <span className="font-jakarta font-bold text-sm text-amber-300">
                {profile.streakDays} Day Streak!
              </span>
            </div>
          </div>
        </div>

        {/* Coins Display */}
        <div className="bg-purple-950/60 p-3.5 rounded-2xl border border-purple-400/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-xl shadow-md">
              🪙
            </div>
            <div>
              <p className="font-jakarta font-bold text-amber-300 text-lg leading-tight">
                {userCoins} Coins
              </p>
              <p className="text-xs text-purple-200">
                {nextLockedLevel
                  ? coinsToNext + ' coins to unlock ' + nextLockedLevel.name
                  : 'All levels unlocked! You are a Master!'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-200 font-jakarta">Earn coins by</p>
            <p className="text-xs text-amber-300 font-bold">answering Mama Titi correctly!</p>
          </div>
        </div>

        {/* Mama Titi Quote */}
        <div className="bg-purple-950/60 p-3.5 rounded-2xl border border-purple-400/20 flex items-start space-x-3">
          <MamaTitiAvatar size="sm" showOnlineStatus={false} />
          <p className="text-xs text-purple-100 italic leading-relaxed font-sans">
            "Knowing your mother tongue is a super power! Answer my questions correctly to earn coins and unlock new Lingo levels!" — Mama Titi
          </p>
        </div>
      </div>

      {/* Naija Word Crush — now a real gate, not a permanent preview */}
      <div
        className={
          'p-4 rounded-3xl border-2 shadow-lg flex items-center justify-between gap-3 ' +
          (isWordCrushUnlocked
            ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 border-amber-600'
            : 'bg-slate-50 border-slate-200')
        }
      >
        <div className="flex items-center space-x-3">
          <div
            className={
              'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border-2 ' +
              (isWordCrushUnlocked
                ? 'bg-[#005029] text-amber-300 border-amber-200'
                : 'bg-slate-100 text-slate-400 border-slate-200')
            }
          >
            {isWordCrushUnlocked ? '🎮' : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <span
              className={
                'px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ' +
                (isWordCrushUnlocked
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-slate-200 text-slate-500')
              }
            >
              {isWordCrushUnlocked ? 'Unlocked' : 'Locked'}
            </span>
            <h3 className={'font-serif font-extrabold text-sm sm:text-base leading-tight ' + (isWordCrushUnlocked ? 'text-slate-950' : 'text-slate-500')}>
              Naija Word Crush 🌍
            </h3>
            <p className={'text-[11px] font-medium ' + (isWordCrushUnlocked ? 'text-slate-800' : 'text-slate-400')}>
              {isWordCrushUnlocked
                ? 'Fruit Match, Lego Word Builder and Speed Crush'
                : (WORD_CRUSH_UNLOCK_COINS - userCoins) + ' more coins to unlock'}
            </p>
          </div>
        </div>
        {isWordCrushUnlocked ? (
          <button
            onClick={onOpenWordCrushPreview}
            className="px-4 py-2.5 rounded-2xl bg-[#005029] hover:bg-[#023319] text-amber-300 font-jakarta font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center space-x-1"
          >
            <span>Play</span>
            <Play className="w-3.5 h-3.5 fill-amber-300" />
          </button>
        ) : (
          <div className="flex flex-col items-center shrink-0">
            <Lock className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
              {WORD_CRUSH_UNLOCK_COINS} 🪙
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-full bg-slate-200/80 p-1 font-jakarta font-bold text-xs">
        <button
          onClick={() => setActiveTab('levels')}
          className={
            'flex-1 py-2.5 rounded-full transition-all ' +
            (activeTab === 'levels'
              ? 'bg-[#5B21B6] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          Levels 🏆
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={
            'flex-1 py-2.5 rounded-full transition-all ' +
            (activeTab === 'words'
              ? 'bg-[#5B21B6] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          Word Cards 📖
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={
            'flex-1 py-2.5 rounded-full transition-all ' +
            (activeTab === 'game'
              ? 'bg-[#5B21B6] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900')
          }
        >
          Quiz Game 🎮
        </button>
      </div>

      {/* Current level indicator — shown on Words and Game tabs so it's always clear what's being studied */}
      {activeTab !== 'levels' && (
        <button
          onClick={() => setActiveTab('levels')}
          className="w-full flex items-center space-x-2 bg-white border-2 border-purple-200 rounded-2xl px-4 py-2.5 text-left hover:border-purple-400 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-lg">{currentLevel.emoji}</span>
          <div className="flex-1">
            <p className="text-[10px] font-jakarta font-bold text-purple-600 uppercase tracking-wide">
              Level {currentLevel.id}
            </p>
            <p className="text-sm font-jakarta font-bold text-slate-800">{currentLevel.name}</p>
          </div>
          <span className="text-xs font-jakarta font-bold text-purple-500">Change level</span>
        </button>
      )}

      {/* TAB 1: Levels */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="font-serif font-bold text-xl text-slate-800">
              Your Lingo Journey
            </h2>
            <p className="text-xs text-slate-500">
              Answer Mama Titi correctly to earn coins and unlock levels
            </p>
          </div>

          <div className="space-y-3">
            {LINGO_LEVELS.map(level => {
              const isUnlocked = userCoins >= level.coinsRequired;
              const isCurrentLevel = isUnlocked && (
                !getNextLockedLevel(userCoins) ||
                (getNextLockedLevel(userCoins)!.id === level.id + 1)
              );
              const coinsNeeded = level.coinsRequired - userCoins;
              const hasContent = getWordsForLevel(level.id).length > 0;

              return (
                <div
                  key={level.id}
                  className={
                    'p-4 rounded-2xl border-2 flex items-center justify-between transition-all ' +
                    (isUnlocked
                      ? isCurrentLevel
                        ? 'bg-amber-50 border-amber-400 shadow-md'
                        : 'bg-white border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70')
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={
                        'w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ' +
                        (isUnlocked ? 'bg-white' : 'bg-slate-100')
                      }
                    >
                      {isUnlocked ? level.emoji : '🔒'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-jakarta font-bold text-sm text-slate-800">
                          Level {level.id}: {level.name}
                        </h3>
                        {isCurrentLevel && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{level.description}</p>
                      {!isUnlocked && (
                        <p className="text-xs text-amber-600 font-bold mt-0.5">
                          🪙 {coinsNeeded} more coins needed
                        </p>
                      )}
                      {isUnlocked && level.coinsRequired > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          ✅ Unlocked at {level.coinsRequired} coins
                        </p>
                      )}
                      {level.coinsRequired === 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          ✅ Free for everyone
                        </p>
                      )}
                      {isUnlocked && !hasContent && (
                        <p className="text-xs text-slate-400 italic mt-0.5">
                          More words coming soon!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isUnlocked ? (
                      <button
                        onClick={() => handlePlayLevel(level.id)}
                        disabled={!hasContent}
                        className="px-3 py-1.5 rounded-full bg-[#5B21B6] text-white text-xs font-bold hover:bg-purple-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Play
                      </button>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Lock className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {level.coinsRequired} 🪙
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How to earn coins box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
            <h3 className="font-jakarta font-bold text-sm text-emerald-800">
              How to earn coins 🪙
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <span className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center font-bold">✓</span>
                <span>Answer Mama Titi correctly = 10 coins</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <span className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center font-bold">🔥</span>
                <span>3 correct answers in a row = 20 bonus coins</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <span className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center font-bold">📸</span>
                <span>Snap homework photo = 5 coins</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <span className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center font-bold">🎮</span>
                <span>Answer Lingo quiz correctly = 10 coins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Word Cards — now filtered to the selected level's words only */}
      {activeTab === 'words' && (
        <div className="space-y-6">
          {levelWords.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 text-center space-y-2">
              <span className="text-4xl">🚧</span>
              <p className="font-jakarta font-bold text-slate-700">
                Words for this level are coming soon!
              </p>
              <p className="text-xs text-slate-500">
                Pick a different level to keep learning in the meantime.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-[#FFFBF5] p-6 rounded-3xl border-2 border-amber-300 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                  <span className="inline-flex items-center space-x-1 text-xs font-jakarta font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>WORD OF THE DAY</span>
                  </span>
                  <span className="text-xs font-jakarta font-bold text-slate-500">
                    {wordOfTheDay.language}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                      {wordOfTheDay.word}
                    </h2>
                    <YorubaListenButton text={wordOfTheDay.word} label="Listen Word" />
                  </div>
                  <p className="text-xs font-sans text-slate-500 italic">
                    Phonetic: [{wordOfTheDay.phonetic}]
                  </p>
                  <p className="text-base font-bold text-[#FF6B35] font-jakarta pt-1">
                    "{wordOfTheDay.englishTranslation}"
                  </p>
                </div>
                <SyncedReadAlong
                  text={wordOfTheDay.word + ' means ' + wordOfTheDay.englishTranslation + '. ' + wordOfTheDay.culturalNote}
                  language="yo"
                />
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-slate-700 space-y-1">
                  <span className="font-jakarta font-bold text-amber-900 block">
                    Cultural Heritage Note:
                  </span>
                  <p className="font-sans leading-relaxed">{wordOfTheDay.culturalNote}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  {currentLevel.name} Vocabulary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {levelWords.map(w => (
                    <div
                      key={w.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-[#5B21B6] transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-serif text-lg font-bold text-slate-900">{w.word}</h4>
                            <p className="text-xs font-bold text-[#FF6B35] font-jakarta">{w.englishTranslation}</p>
                          </div>
                          <span className="text-[10px] font-jakarta font-bold bg-purple-100 text-[#5B21B6] px-2 py-0.5 rounded-full shrink-0">
                            {w.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic font-sans">{w.sampleSentence}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-1">
                        <YorubaListenButton text={w.word} label="Listen" />
                        {w.sampleSentence && (
                          <YorubaListenButton text={w.sampleSentence} label="Sentence" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {levelQuizzes.length > 0 && (
                <button
                  onClick={() => setActiveTab('game')}
                  className="w-full py-4 rounded-2xl bg-[#5B21B6] hover:bg-purple-800 text-white font-jakarta font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Test Yourself — {currentLevel.name} Quiz</span>
                  <Play className="w-4 h-4 fill-white" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: Quiz Game — now filtered to the selected level's quizzes only */}
      {activeTab === 'game' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-6">
          {levelQuizzes.length === 0 || !quiz ? (
            <div className="text-center space-y-2 py-6">
              <span className="text-4xl">🚧</span>
              <p className="font-jakarta font-bold text-slate-700">
                A quiz for this level is coming soon!
              </p>
              <p className="text-xs text-slate-500">
                Pick a different level to keep the streak going.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-emerald-600 to-[#064E3B] text-white p-3.5 px-4 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/30 text-amber-300">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-xs sm:text-sm block">
                      Challenge Friends on WhatsApp!
                    </span>
                    <span className="text-[10px] text-emerald-100 block">
                      Invite classmates to beat your high score
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleShareOnWhatsApp}
                  className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-jakarta font-bold text-xs shadow-sm transition-all flex items-center space-x-1 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-jakarta font-bold text-slate-500">
                  Question {currentQuizIndex + 1} of {levelQuizzes.length}
                </span>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-jakarta font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Score: {score} ⭐
                  </span>
                  <span className="text-xs font-jakarta font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    {userCoins} 🪙
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-center py-2 flex flex-col items-center">
                <span className="text-xs font-jakarta font-bold text-purple-700 uppercase tracking-wide">
                  What is the meaning of:
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#064E3B]">
                  "{quiz.word}"
                </h2>
                <YorubaListenButton text={quiz.word} label="Listen Pronunciation" />
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {quiz.options.map(opt => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === quiz.correctAnswer;

                  let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                  if (isAnswered) {
                    if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                    else if (isSelected && !isCorrect) btnStyle = 'bg-rose-100 border-rose-400 text-rose-900';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered}
                      className={'w-full py-3.5 px-4 rounded-2xl border-2 text-left font-jakarta font-semibold text-sm transition-all flex items-center justify-between ' + btnStyle}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                  <p className="font-bold font-jakarta">
                    {selectedOption === quiz.correctAnswer
                      ? '🎉 Correct! You earned 10 coins!'
                      : '💡 Keep learning! Try the next question.'}
                  </p>
                  <p className="font-sans">{quiz.explanation}</p>
                  <button
                    onClick={handleNextQuiz}
                    className="w-full py-3 rounded-full bg-[#5B21B6] hover:bg-purple-900 text-white font-jakarta font-bold text-xs shadow-md mt-2"
                  >
                    {currentQuizIndex < levelQuizzes.length - 1 ? 'Next Challenge' : 'Play Again'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
