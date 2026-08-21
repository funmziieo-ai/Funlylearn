import React, { useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Heart, Volume2, Loader2 } from 'lucide-react';
import { UserProfile, ClassLevel, LanguageCode } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialProfile.name || '');
  const [classLevel, setClassLevel] = useState<ClassLevel | null>(initialProfile.classLevel || null);
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

  const handleNextStep2 = () => setStep(3);

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

  return (
    <div className="h-screen overflow-hidden bg-[#FFFBF5] text-slate-800 font-sans flex flex-col p-4 sm:p-6">

      {/* Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-full bg-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-[#064E3B] flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="font-serif text-xl font-bold text-[#064E3B]">FunlyLearn 🇳🇬</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={
                'h-2 rounded-full transition-all ' +
                (step === s
                  ? 'w-6 bg-[#064E3B]'
                  : step > s
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-slate-200')
              }
            />
          ))}
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Exit
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto w-full flex-1 overflow-y-auto flex flex-col justify-center py-6">

        {/* STEP 1 — Name */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6 text-center">
            <div className="flex justify-center mb-2">
              <MamaTitiAvatar size="lg" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                What is your child's name?
              </h2>
              <p className="text-xs text-slate-500">
                Mama Titi will address them personally during every lesson!
              </p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tobi, Chidinma, Amina"
              required
              className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#064E3B] text-slate-800 font-bold text-lg text-center shadow-sm outline-none transition-all"
            />
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "Welcome my star! I am excited to guide you step by step through your school topics!" — Mama Titi
              </p>
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 rounded-full bg-[#064E3B] hover:bg-[#022C22] disabled:opacity-40 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 2 — Class Level */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                What class is {name || 'scholar'} in?
              </h2>
              <p className="text-xs text-slate-500">
                We will tailor the learning to their exact school level.
              </p>
            </div>

            {/* Out of school toggle */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-xs font-bold text-slate-800">
                  Not currently in school?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOutOfSchool(!isOutOfSchool)}
                className={
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ' +
                  (isOutOfSchool ? 'bg-[#FF6B35]' : 'bg-slate-300')
                }
              >
                <span
                  className={
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ' +
                    (isOutOfSchool ? 'translate-x-5' : 'translate-x-0')
                  }
                />
              </button>
            </div>

            {classLevel ? (
              /* A class has been chosen — show only that one, with a way to change it */
              <div className="p-4 rounded-2xl bg-[#064E3B] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-white text-[#064E3B] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">{classLevel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setClassLevel(null)}
                  className="text-xs font-bold text-emerald-200 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                {/* Primary classes */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Primary School
                  </span>
                  <div className="grid grid-cols-3 gap-2.5 mt-2">
                    {primaryClasses.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setClassLevel(cls)}
                        className="py-3 px-2 rounded-full border-2 text-xs font-bold transition-all border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary classes */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Secondary School
                  </span>
                  <div className="grid grid-cols-3 gap-2.5 mt-2">
                    {secondaryClasses.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setClassLevel(cls)}
                        className="py-3 px-2 rounded-full border-2 text-xs font-bold transition-all border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Mama Titi bubble */}
            <div className="p-4 rounded-3xl bg-white border border-amber-200 shadow-sm flex items-start space-x-3">
              <MamaTitiAvatar size="sm" showOnlineStatus={false} />
              <div className="text-xs space-y-0.5">
                <span className="font-serif font-bold text-purple-900 block">
                  "Well done scholar!"
                </span>
                <p className="text-slate-600 italic">
                  "The right class level means I teach exactly what {name || 'your child'} needs for their exams."
                </p>
              </div>
            </div>

            <button
              onClick={handleNextStep2}
              disabled={!classLevel}
              className="w-full py-4 rounded-full bg-[#064E3B] hover:bg-[#022C22] disabled:opacity-40 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 3 — Language */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            <div className="space-y-2">
              <div className="flex justify-center mb-3">
                <MamaTitiAvatar size="md" showOnlineStatus={false} />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                How should Mama Titi teach?
              </h2>
              <p className="text-xs text-slate-500">
                Pick your language. You can always change this later!
              </p>
            </div>

            <div className="space-y-3 pt-1 text-left">

              {/* English */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={
                  'w-full p-4 rounded-3xl border-2 flex items-center space-x-4 transition-all ' +
                  (language === 'en'
                    ? 'border-[#064E3B] bg-emerald-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-emerald-200')
                }
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl shrink-0">
                  🇬🇧
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-900">
                    English
                  </h4>
                  <p className="text-xs text-slate-500">
                    Mama Titi teaches in English
                  </p>
                </div>
                {language === 'en' && (
                  <div className="w-7 h-7 rounded-full bg-[#064E3B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Yoruba */}
              <button
                type="button"
                onClick={() => setLanguage('yo')}
                className={
                  'w-full p-4 rounded-3xl border-2 flex items-center space-x-4 transition-all ' +
                  (language === 'yo'
                    ? 'border-[#5B21B6] bg-purple-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-purple-200')
                }
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-900">
                    Yoruba
                  </h4>
                  <p className="text-xs text-slate-500">
                    Mama Titi teaches in Yoruba
                  </p>
                </div>
                {language === 'yo' && (
                  <div className="w-7 h-7 rounded-full bg-[#5B21B6] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* English & Yoruba voice previews — both always visible to
                  create anticipation, not just after selecting a language */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayPreview('en')}
                  disabled={previewLoading !== null}
                  className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {previewLoading === 'en' ? (
                    <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  )}
                  <span className="text-xs sm:text-sm font-bold text-emerald-800">
                    {activePreviewLang === 'en' ? 'Playing...' : 'Hear in English'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayPreview('yo')}
                  disabled={previewLoading !== null}
                  className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {previewLoading === 'yo' ? (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  )}
                  <span className="text-xs sm:text-sm font-bold text-purple-700">
                    {activePreviewLang === 'yo' ? 'Playing...' : 'Hear in Yoruba'}
                  </span>
                </button>
              </div>

              {language === 'yo' && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-left">
                  <p className="text-xs font-bold text-purple-800 mb-1">
                    Preview of Yoruba mode:
                  </p>
                  <p className="text-sm text-purple-700 italic">
                    "{YORUBA_PREVIEW_TEXT}"
                  </p>
                  <p className="text-[10px] text-purple-500 mt-1">
                    Good morning! My name is Mama Titi. Let us learn together today!
                  </p>
                </div>
              )}

              {/* Igbo — Coming Soon */}
              <div className="w-full p-4 rounded-3xl border border-slate-200 bg-slate-50 flex items-center space-x-4 opacity-60">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-400">
                    Igbo
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mama Titi teaches in Igbo
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0">
                  Coming Soon
                </span>
              </div>

              {/* Hausa — Coming Soon */}
              <div className="w-full p-4 rounded-3xl border border-slate-200 bg-slate-50 flex items-center space-x-4 opacity-60">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-400">
                    Hausa
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mama Titi teaches in Hausa
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0">
                  Coming Soon
                </span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#064E3B] to-[#5B21B6] hover:opacity-95 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Learning with Mama Titi!</span>
            </button>

            <p className="text-[11px] text-slate-400">
              You are seconds away from your first lesson!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
