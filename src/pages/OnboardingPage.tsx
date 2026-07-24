import React, { useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Sparkles, BookOpen, Heart } from 'lucide-react';
import { UserProfile, ClassLevel, LanguageCode } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';

interface OnboardingPageProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onExit?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  initialProfile,
  onComplete,
  onExit
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialProfile.name || '');
  const [classLevel, setClassLevel] = useState<ClassLevel>(initialProfile.classLevel || 'JSS 1');
  const [isOutOfSchool, setIsOutOfSchool] = useState(initialProfile.isOutOfSchool || false);
  const [language, setLanguage] = useState<LanguageCode>(initialProfile.language || 'en');

  const primaryClasses: ClassLevel[] = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
  const secondaryClasses: ClassLevel[] = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleFinish = () => {
    onComplete({
      ...initialProfile,
      name: name.trim() || 'Scholar',
      classLevel,
      isOutOfSchool,
      language
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-slate-800 font-sans flex flex-col justify-between p-4 sm:p-6">
      
      {/* Header Bar */}
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
          <img
            src="/assets/images/funlylearn_logo.jpg"
            alt="FunlyLearn Logo"
            className="w-7 h-7 rounded-full object-cover border border-amber-400"
            referrerPolicy="no-referrer"
          />
          <span className="font-serif text-xl font-bold text-[#064E3B]">FunlyLearn 🇳🇬</span>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center space-x-1.5">
          <div className={`h-2 rounded-full transition-all ${step === 1 ? 'w-6 bg-[#064E3B]' : 'w-2 bg-slate-300'}`} />
          <div className={`h-2 rounded-full transition-all ${step === 2 ? 'w-6 bg-[#064E3B]' : 'w-2 bg-slate-300'}`} />
          <div className={`h-2 rounded-full transition-all ${step === 3 ? 'w-6 bg-[#064E3B]' : 'w-2 bg-slate-300'}`} />
        </div>

        {onExit && (
          <button onClick={onExit} className="text-xs font-jakarta font-semibold text-slate-500 hover:text-slate-800">
            Exit
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-6">
        
        {/* STEP 1: Child's Name */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="flex justify-center mb-2">
              <MamaTitiAvatar size="lg" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                What is your child's name?
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                Mama Titi will address them by name during homework lessons!
              </p>
            </div>

            <div className="pt-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tobi, Chidinma, or Amina"
                required
                className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#064E3B] text-slate-800 font-jakarta font-semibold text-lg text-center shadow-xs outline-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#064E3B]/5 border border-[#064E3B]/10 text-left flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                "Welcome, my star! I am excited to guide you step-by-step through your school topics!" — Mama Titi
              </p>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 rounded-full bg-[#064E3B] hover:bg-[#022C22] disabled:opacity-50 text-white font-jakarta font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 2: Class Selection */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                What class is {name || 'scholar'} in?
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                We'll tailor the learning journey to their specific school level.
              </p>
            </div>

            {/* Out of school toggle above the grid */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-xs font-jakarta font-semibold text-slate-800">
                  Not currently in school?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOutOfSchool(!isOutOfSchool)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOutOfSchool ? 'bg-[#FF6B35]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isOutOfSchool ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Class Grid */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-jakarta font-bold tracking-wider text-slate-400 uppercase">
                  PRIMARY SCHOOL
                </span>
                <div className="grid grid-cols-3 gap-2.5 mt-2">
                  {primaryClasses.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassLevel(cls)}
                      className={`py-3 px-2 rounded-full border-2 text-xs font-jakarta font-bold transition-all ${
                        classLevel === cls
                          ? 'border-[#064E3B] bg-[#064E3B] text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-jakarta font-bold tracking-wider text-slate-400 uppercase">
                  SECONDARY SCHOOL
                </span>
                <div className="grid grid-cols-3 gap-2.5 mt-2">
                  {secondaryClasses.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassLevel(cls)}
                      className={`py-3 px-2 rounded-full border-2 text-xs font-jakarta font-bold transition-all ${
                        classLevel === cls
                          ? 'border-[#064E3B] bg-[#064E3B] text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mama Titi speech bubble */}
            <div className="p-4 rounded-3xl bg-white border border-amber-200 shadow-soft flex items-start space-x-3">
              <MamaTitiAvatar size="sm" showOnlineStatus={false} />
              <div className="text-xs space-y-0.5">
                <span className="font-serif font-bold text-purple-900 block">
                  "Well done, scholar! 🇳🇬"
                </span>
                <p className="text-slate-600 italic">
                  "Choosing the right level ensures we start with the perfect books and challenges for {name}'s bright mind."
                </p>
              </div>
            </div>

            <button
              onClick={handleNextStep2}
              className="w-full py-4 rounded-full bg-[#064E3B] hover:bg-[#022C22] text-white font-jakarta font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 3: Language Selection */}
        {step === 3 && (
          <div className="space-y-5 text-center animate-in fade-in duration-300">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#064E3B]">
                How should Mama Titi teach?
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                Select your preferred way to learn with your AI auntie. You can change this anytime! 🇳🇬
              </p>
            </div>

            <div className="space-y-3 pt-2">
              
              {/* English Card */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`w-full p-4 rounded-3xl border-2 text-left flex items-center space-x-4 transition-all relative ${
                  language === 'en'
                    ? 'border-[#5B21B6] bg-[#F3E8FF] shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                  🇬🇧
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-900">English</h4>
                  <p className="text-xs text-slate-500">Mama Titi teaches in English</p>
                </div>
                {language === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-[#5B21B6] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Yoruba Card */}
              <button
                type="button"
                onClick={() => setLanguage('yo')}
                className={`w-full p-4 rounded-3xl border-2 text-left flex items-center space-x-4 transition-all relative ${
                  language === 'yo'
                    ? 'border-[#5B21B6] bg-[#F3E8FF] shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-900">Yoruba</h4>
                  <p className="text-xs text-slate-500">Mama Titi teaches in Yoruba & English</p>
                </div>
                {language === 'yo' && (
                  <div className="w-6 h-6 rounded-full bg-[#5B21B6] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Igbo Card (Disabled) */}
              <div className="w-full p-4 rounded-3xl border border-slate-200 bg-slate-50 opacity-60 text-left flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-500">Igbo</h4>
                  <p className="text-xs text-slate-400">Mama Titi teaches in Igbo</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-jakarta font-bold">
                  Coming Soon
                </span>
              </div>

              {/* Hausa Card (Disabled) */}
              <div className="w-full p-4 rounded-3xl border border-slate-200 bg-slate-50 opacity-60 text-left flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl shrink-0">
                  🇳🇬
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-lg text-slate-500">Hausa</h4>
                  <p className="text-xs text-slate-400">Mama Titi teaches in Hausa</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-jakarta font-bold">
                  Coming Soon
                </span>
              </div>

            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#5B21B6] hover:opacity-95 text-white font-jakarta font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Learning!</span>
            </button>

            <p className="text-[11px] text-slate-400">
              You're just seconds away from your first lesson!
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
