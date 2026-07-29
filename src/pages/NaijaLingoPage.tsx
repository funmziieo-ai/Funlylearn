import React, { useState, useRef } from 'react';
import { Volume2, Pause, Loader2, AlertCircle, Sparkles, Flame, Play, CheckCircle2, RotateCcw, Share2, MessageCircle, Lock, Coins } from 'lucide-react';
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
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlaying(false);
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const res = await fetchAudioTTS(text, 'yo');
      if (res.audioBase64) {
        const audio = new Audio(res.audioBase64);
        audioRef.current = audio;
        audio.onended = () => {
          setPlaying(false);
          audioRef.current = null;
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
      // Fallback
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.lang = 'yo-NG';
        utterance.onstart = () => {
          setLoading(false);
          setPlaying(true);
        };
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => {
          setLoading(false);
          setPlaying(false);
          setError(true);
        };
        window.speechSynthesis.speak(utterance);
        return;
      } catch (_err) {}
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
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const userCoins = profile.coins || 0;
  const wordOfTheDay = NAIJA_LINGO_WORDS[0];
  const quiz = LINGO_QUIZZES[currentQuizIndex];
  const unlockedLevels = getUnlockedLevels(userCoins);
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

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
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
    if (currentQuizIndex < LINGO_QUIZZES.length - 1) {
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

      {/* Game Preview Banner */}
      {onOpenWordCrushPreview && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 p-4 rounded-3xl border-2 border-amber-600 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#005029] text-amber-300 flex items-center justify-center text-2xl shadow-sm shrink-0 border-2 border-amber-200">
              🎮
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[10px] uppercase">
                New Game Preview
              </span>
              <h3 className="font-serif font-extrabold text-sm sm:text-base leading-tight text-slate-950">
                Naija Word Crush 🌍
              </h3>
              <p className="text-[11px] text-slate-800 font-medium">
                Fruit Match, Lego Word Builder and Speed Crush
              </p>
            </div>
          </div>
          <button
            onClick={onOpenWordCrushPreview}
            className="px-4 py-2.5 rounded-2xl bg-[#005029] hover:bg-[#023319] text-amber-300 font-jakarta font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center space-x-1"
          >
            <span>Play</span>
            <Play className="w-3.5 h-3.5 fill-amber-300" />
          </button>
        </div>
      )}

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
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          setSelectedLevel(level.id);
                          setActiveTab('words');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#5B21B6] text-white text-xs font-bold hover:bg-purple-800 transition-all"
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

      {/* TAB 2: Word Cards */}
      {activeTab === 'words' && (
        <div className="space-y-6">
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
              Yoruba and Nigerian Vocabulary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NAIJA_LINGO_WORDS.map(w => (
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
        </div>
      )}

      {/* TAB 3: Quiz Game */}
      {activeTab === 'game' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-6">
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
              Question {currentQuizIndex + 1} of {LINGO_QUIZZES.length}
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
                {currentQuizIndex < LINGO_QUIZZES.length - 1 ? 'Next Challenge' : 'Play Again'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
