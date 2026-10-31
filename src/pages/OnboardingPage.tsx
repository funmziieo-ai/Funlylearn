import React, { useState } from 'react';
import { Check, Volume2, Loader2 } from 'lucide-react';
import { UserProfile, ClassLevel, LanguageCode } from '../types';
import { Emoji3D } from '../components/Emoji3D';
import { ANKARA, ANKARA_DOTS, useFunFonts } from './LandingPage';
import mamaTitiMain from '../assets/images/mama_titi_official_1784860280943.jpg';

const FUN = "font-['Fredoka']";
const PRESS = 'transition-transform active:translate-y-[4px]';
import { fetchAudioTTS, clearStoredChat } from '../services/apiClient';

interface OnboardingPageProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onExit?: () => void;
}

const YORUBA_PREVIEW_TEXT = 'Ẹ kaaro! Orukọ mi ni Mama Titi. Jẹ ki a kọ ẹkọ papọ loni!';
const ENGLISH_PREVIEW_TEXT = 'Hello! My name is Mama Titi. Let us learn together today!';

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  initialProfile,
  onComplete,
  onExit
}) => {
  useFunFonts();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialProfile.name || '');
  // New children choose their own class (no silent "JSS 1" default);
  // someone editing an existing profile keeps their class.
  const [classLevel, setClassLevel] = useState<ClassLevel | null>(
    initialProfile.name ? initialProfile.classLevel || null : null
  );
  const [isOutOfSchool, setIsOutOfSchool] = useState(initialProfile.isOutOfSchool || false);
  const [language, setLanguage] = useState<LanguageCode>(initialProfile.language || 'en');
  const [previewLoading, setPreviewLoading] = useState<'en' | 'yo' | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [activePreviewLang, setActivePreviewLang] = useState<'en' | 'yo' | null>(null);

  const primaryClasses: ClassLevel[] = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
  const secondaryClasses: ClassLevel[] = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setStep(2);
  };

  // Continue is always tappable. Without a class (or a learning level, for
  // children not in school), the class list gives a gentle shake and a
  // short note explains what's needed, instead of a silent grey button.
  const [needClassNote, setNeedClassNote] = useState(false);
  const [shakeClasses, setShakeClasses] = useState(false);
  const handleNextStep2 = () => {
    if (!classLevel) {
      setNeedClassNote(true);
      setShakeClasses(true);
      setTimeout(() => setShakeClasses(false), 500);
      return;
    }
    setNeedClassNote(false);
    setStep(3);
  };

  const handleFinish = () => {
    // Onboarding completion means "this is a fresh scholar" — reset every
    // gamification/progress field to a true default instead of inheriting
    // whatever was last cached on this device (e.g. from testing), and
    // clear per-feature local data (chat history, Word Crush high score)
    // so every new signup genuinely starts clean across all features.
    clearStoredChat();
    try {
      localStorage.removeItem('naija_word_crush_highscore');
    } catch (_e) {
      // localStorage unavailable — nothing to clean up
    }

    onComplete({
      ...initialProfile,
      name: name.trim() || 'Scholar',
      classLevel: classLevel || 'JSS 1',
      isOutOfSchool,
      language,
      coins: 0,
      stars: 0,
      streakDays: 1,
      correctStreak: 0,
      totalCorrect: 0,
      homeworksSnapped: 0,
      level: 1,
      parentApprovedCount: 0,
      unlockedRewards: ['r1']
    });
  };

  const handlePlayPreview = async (lang: 'en' | 'yo') => {
    if (previewAudio && activePreviewLang === lang) {
      previewAudio.pause();
      setPreviewAudio(null);
      setActivePreviewLang(null);
      return;
    }
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }

    const text = lang === 'yo' ? YORUBA_PREVIEW_TEXT : ENGLISH_PREVIEW_TEXT;
    setPreviewLoading(lang);
    try {
      const ttsData = await fetchAudioTTS(text, lang);
      if (ttsData.audioUrl) {
        const audio = new Audio(ttsData.audioUrl);
        audio.onended = () => {
          setPreviewAudio(null);
          setActivePreviewLang(null);
          URL.revokeObjectURL(ttsData.audioUrl!);
        };
        setPreviewAudio(audio);
        setActivePreviewLang(lang);
        await audio.play();
      }
      // Real voice failed — no browser voice fallback, fail honestly
      // instead, matching the same standard as Mama Titi's main voice.
    } catch {
      // Preview failing quietly is fine — this is just a taste, not core functionality
    } finally {
      setPreviewLoading(null);
    }
  };

  const MamaBubble: React.FC<{ title?: string; text: string }> = ({ title, text }) => (
    <div className="rounded-3xl bg-white border-2 border-emerald-100 p-4 flex items-start gap-3 text-left shadow-sm">
      <img src={mamaTitiMain} alt="" className="w-11 h-11 rounded-full object-cover object-top border-[3px] border-[#FFC83D] shrink-0" />
      <div className="text-sm">
        {title && <p className={`${FUN} font-bold text-[#064E3B]`}>{title}</p>}
        <p className="font-semibold text-slate-600">{text}</p>
      </div>
    </div>
  );

  const ContinueButton: React.FC<{ disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit'; children: React.ReactNode }> = ({ disabled, onClick, type = 'button', children }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#15803D] text-white text-xl font-bold border-b-[6px] border-[#064E3B] disabled:opacity-40 disabled:active:translate-y-0`}
    >
      {children}
    </button>
  );

  const classTile = (cls: ClassLevel) => (
    <button
      key={cls}
      type="button"
      onClick={() => {
        setClassLevel(cls);
        setNeedClassNote(false);
      }}
      className={`${FUN} ${PRESS} py-3 rounded-2xl border-2 border-b-4 text-base font-semibold bg-white text-slate-800 border-slate-200`}
    >
      {cls}
    </button>
  );

  const languageCard = (code: 'en' | 'yo', flag: string, title: string, subtitle: string, color: string, light: string) => (
    <button
      type="button"
      onClick={() => setLanguage(code)}
      className={`${PRESS} w-full p-4 rounded-3xl border-2 border-b-[5px] flex items-center gap-4 text-left ${
        language === code ? `${light}` : 'border-slate-200 bg-white'
      }`}
      style={language === code ? { borderColor: color } : undefined}
    >
      <Emoji3D emoji={flag} className="w-12 h-12 shrink-0" />
      <div className="flex-1">
        <p className={`${FUN} text-xl font-bold text-slate-900`}>{title}</p>
        <p className="text-sm font-semibold text-slate-600">{subtitle}</p>
      </div>
      {language === code && (
        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
          <Check className="w-5 h-5" />
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-slate-800 font-['Nunito'] flex flex-col" style={ANKARA_DOTS}>
      {/* Header: same logo as the landing page */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2)}
              aria-label="Back"
              className={`${PRESS} w-10 h-10 rounded-full bg-white border-2 border-slate-200 border-b-4 font-bold text-[#064E3B]`}
            >
              ◀
            </button>
          )}
          <div className={`${FUN} w-9 h-9 rounded-2xl bg-[#15803D] text-white text-xl font-bold flex items-center justify-center border-b-4 border-[#064E3B]`}>F</div>
          {/* On the smallest phones (under 360px) only the green F logo shows. */}
          <span className={`${FUN} hidden min-[360px]:inline text-xl font-bold text-slate-900`}>Funly<span className="text-[#15803D]">Learn</span></span>
        </div>
        <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map(s => (
            <span
              key={s}
              className={`h-2.5 rounded-full transition-all ${step === s ? 'w-7 bg-[#15803D]' : step > s ? 'w-2.5 bg-[#FFC83D]' : 'w-2.5 bg-slate-300'}`}
            />
          ))}
        </div>
        {onExit && (
          <button onClick={onExit} aria-label="Exit" className="font-bold text-slate-700 px-2 py-2 shrink-0">
            <span className="min-[360px]:hidden" aria-hidden="true">✕</span>
            <span className="hidden min-[360px]:inline">Exit</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-5 py-6">
        {/* STEP 1: name */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5 text-center">
            <div className="w-32 h-32 mx-auto rounded-full bg-white border-[6px] border-[#FFC83D] shadow-xl overflow-hidden">
              <img src={mamaTitiMain} alt="Mama Titi" className="w-full h-full object-cover object-top" />
            </div>
            <div className="space-y-1.5">
              <h2 className={`${FUN} text-3xl font-bold text-slate-900 leading-tight`}>What is your child's name?</h2>
              <p className="font-semibold text-slate-600">Mama Titi will call them by name in every lesson!</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tobi, Chidinma, Amina"
              required
              maxLength={30}
              className={`${FUN} w-full px-5 py-4 rounded-2xl bg-white border-2 border-b-4 border-slate-200 focus:border-[#15803D] outline-none text-xl font-semibold text-center text-slate-900`}
            />
            <MamaBubble text={'"Welcome, my star! I can\'t wait to help you with your school topics, step by step!"'} />
            <ContinueButton type="submit" disabled={!name.trim()}>Continue ▶</ContinueButton>
          </form>
        )}

        {/* STEP 2: class */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className={`${FUN} text-3xl font-bold text-slate-900 leading-tight`}>
                {isOutOfSchool ? 'What level should Mama Titi teach?' : `What class is ${name || 'your child'} in?`}
              </h2>
              <p className="font-semibold text-slate-600">
                {isOutOfSchool
                  ? `No problem! Choose the level ${name || 'your child'} would like to learn at.`
                  : 'Mama Titi teaches at exactly the right level.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white border-2 border-b-4 border-slate-200 p-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-bold text-slate-800">
                <Emoji3D emoji="🏠" className="w-7 h-7" /> Not in school right now?
              </span>
              <button
                type="button"
                onClick={() => setIsOutOfSchool(!isOutOfSchool)}
                role="switch"
                aria-checked={isOutOfSchool}
                aria-label="Not in school right now"
                className={`relative w-14 h-8 rounded-full shrink-0 transition-colors ${isOutOfSchool ? 'bg-[#FF6B35]' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${isOutOfSchool ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {classLevel ? (
              <div className="rounded-2xl bg-[#15803D] border-b-[5px] border-[#064E3B] p-4 flex items-center justify-between">
                <span className={`${FUN} flex items-center gap-2 text-xl font-bold text-white`}>
                  <span className="w-8 h-8 rounded-full bg-white text-[#15803D] flex items-center justify-center"><Check className="w-5 h-5" /></span>
                  {classLevel}
                </span>
                <button type="button" onClick={() => setClassLevel(null)} className="font-bold text-emerald-100 underline">Change</button>
              </div>
            ) : (
              <div className={`space-y-4 rounded-2xl ${shakeClasses ? 'ob-shake' : ''} ${needClassNote ? 'ring-4 ring-amber-300 ring-offset-4 ring-offset-[#FFF8EC]' : ''}`}>
                <style>{`
                  @keyframes ob-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-8px) } 40% { transform: translateX(8px) } 60% { transform: translateX(-6px) } 80% { transform: translateX(6px) } }
                  .ob-shake { animation: ob-shake .45s ease-in-out; }
                  @media (prefers-reduced-motion: reduce) { .ob-shake { animation: none; } }
                `}</style>
                <div>
                  <p className={`${FUN} font-bold text-slate-700 flex items-center gap-2`}><Emoji3D emoji="🎒" className="w-6 h-6" /> Primary school</p>
                  <div className="grid grid-cols-3 gap-2.5 mt-2">{primaryClasses.map(classTile)}</div>
                </div>
                <div>
                  <p className={`${FUN} font-bold text-slate-700 flex items-center gap-2`}><Emoji3D emoji="🏫" className="w-6 h-6" /> Secondary school</p>
                  <div className="grid grid-cols-3 gap-2.5 mt-2">{secondaryClasses.map(classTile)}</div>
                </div>
              </div>
            )}

            <MamaBubble title="Well done!" text={`"The right class means I teach exactly what ${name || 'your child'} needs for school and exams."`} />
            {needClassNote && !classLevel && (
              <p className="text-center font-bold text-amber-800 bg-amber-100 border-2 border-amber-300 rounded-2xl px-4 py-2.5" role="alert">
                {isOutOfSchool ? '👆🏾 Please choose a level first' : '👆🏾 Please choose a class first'}
              </p>
            )}
            <ContinueButton onClick={handleNextStep2}>Continue ▶</ContinueButton>
          </div>
        )}

        {/* STEP 3: language */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-white border-[5px] border-[#FFC83D] shadow-lg overflow-hidden">
              <img src={mamaTitiMain} alt="Mama Titi" className="w-full h-full object-cover object-top" />
            </div>
            <div className="space-y-1.5">
              <h2 className={`${FUN} text-3xl font-bold text-slate-900 leading-tight`}>How should Mama Titi teach?</h2>
              <p className="font-semibold text-slate-600">Pick a language. You can change it later.</p>
            </div>

            <div className="space-y-3">
              {languageCard('en', '🇬🇧', 'English', 'Mama Titi teaches in English', '#15803D', 'bg-[#DCFCE7]')}
              {languageCard('yo', '🇳🇬', 'Yorùbá', 'Mama Titi teaches in Yorùbá', '#7E22CE', 'bg-[#F3E8FF]')}

              <div className="grid grid-cols-2 gap-2">
                {(['en', 'yo'] as const).map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handlePlayPreview(code)}
                    disabled={previewLoading !== null}
                    className={`${PRESS} p-3 rounded-2xl border-2 border-b-4 bg-white flex items-center justify-center gap-2 font-bold disabled:opacity-60 ${
                      code === 'en' ? 'border-emerald-200 text-[#15803D]' : 'border-purple-200 text-[#7E22CE]'
                    }`}
                  >
                    {previewLoading === code ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                    {activePreviewLang === code ? 'Playing…' : code === 'en' ? 'Hear English' : 'Hear Yorùbá'}
                  </button>
                ))}
              </div>

              {language === 'yo' && (
                <div className="rounded-2xl bg-[#F3E8FF] border-2 border-purple-200 p-4 text-left">
                  <p className="text-sm font-bold text-[#7E22CE]">How Yorùbá mode sounds:</p>
                  <p className="font-semibold text-purple-900 italic mt-1">"{YORUBA_PREVIEW_TEXT}"</p>
                  <p className="text-xs font-semibold text-purple-700 mt-1">Good morning! My name is Mama Titi. Let us learn together today!</p>
                </div>
              )}

              {(['Igbo', 'Hausa'] as const).map(lang => (
                <div key={lang} className="w-full p-4 rounded-3xl border-2 border-slate-200 bg-white/60 flex items-center gap-4 text-left opacity-70">
                  <Emoji3D emoji="🇳🇬" className="w-12 h-12 shrink-0 grayscale" />
                  <div className="flex-1">
                    <p className={`${FUN} text-xl font-bold text-slate-500`}>{lang}</p>
                    <p className="text-sm font-semibold text-slate-500">Mama Titi teaches in {lang}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FFC83D] text-[#064E3B] text-xs font-bold shrink-0">Coming soon</span>
                </div>
              ))}
            </div>

            <ContinueButton onClick={handleFinish}>Start learning with Mama Titi ▶</ContinueButton>
            <p className="text-sm font-semibold text-slate-600">You're seconds away from your first lesson!</p>
          </div>
        )}
      </div>

      <div className="h-2" style={ANKARA} />
    </div>
  );
};
