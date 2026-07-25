import React from 'react';
import {
  ArrowRight, BookOpen, Users, Sparkles, Languages,
  Heart, Camera, GraduationCap
} from 'lucide-react';

interface LandingPageProps {
  onStartLearning: () => void;
  onStartCatchingUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onStartCatchingUp
}) => {

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900 font-sans flex flex-col justify-between">

      {/* Top Header Bar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onStartLearning}>
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-md">
              <img
                src="/assets/images/funlylearn_logo.jpg"
                alt="FunlyLearn Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-amber-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-bold text-xl sm:text-2xl tracking-tight text-emerald-900 block leading-tight">
                FunlyLearn
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold block">
                Official NERDC AI Companion
              </span>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="px-5 py-2.5 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all"
          >
            Start Free 🚀
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 flex-1 flex flex-col items-center w-full">

        {/* Hero Card */}
        <div className="w-full rounded-3xl overflow-hidden shadow-lg mb-4 bg-emerald-600 p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-300/30 px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px] font-bold text-white">🇳🇬 #1 NERDC Curriculum AI Teacher for Nigerian Scholars</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Meet Mama Titi! 🇳🇬
          </h1>

          <div className="flex items-start gap-4 mb-4">
            <p className="flex-1 text-emerald-50 text-sm leading-relaxed">
              Step-by-step Primary 3 to SS3 curriculum help through fun Nigerian stories. Available 24/7 — no expensive private lesson teacher needed!
            </p>
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full overflow-hidden border-4 border-white/40 shadow-lg">
              <img
                src="/assets/images/updated-mama-titi.png"
                alt="Mama Titi"
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="px-6 py-3 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold text-sm shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all"
          >
            Start Learning Free 🚀
          </button>
        </div>

        {/* Stats Card */}
        <div className="w-full py-5 px-6 rounded-3xl bg-emerald-600 text-center mb-6 shadow-md text-white space-y-4">
          <div>
            <div className="text-lg">👥</div>
            <div className="text-sm font-bold">1,480+</div>
            <p className="text-[11px] opacity-90">active scholars</p>
          </div>
          <div>
            <div className="text-lg">📖</div>
            <div className="text-sm font-bold">P3 to SS3</div>
            <p className="text-[11px] opacity-90">NERDC subjects</p>
          </div>
          <div>
            <div className="text-lg">✨</div>
            <div className="text-sm font-bold">100% Free</div>
            <p className="text-[11px] opacity-90">to start today</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="w-full grid grid-cols-1 gap-4 mb-6">

          <div
            onClick={onStartLearning}
            className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-5 shadow-md hover:scale-[1.02] active:scale-[0.99] transition-transform cursor-pointer text-white"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <Camera className="w-6 h-6" />
              <h3 className="text-base font-bold">Homework Snap & Stories</h3>
            </div>
            <p className="text-xs text-white/90 mb-4 leading-snug">
              Snap any textbook question or type your topic. Mama Titi breaks down difficult concepts using relatable Nigerian stories and step-by-step examples.
            </p>
            <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 font-bold py-2.5 px-4 rounded-full text-center text-sm">
              Open Camera 📸
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl p-5 shadow-md hover:scale-[1.02] active:scale-[0.99] transition-transform cursor-pointer text-white">
            <div className="flex items-center gap-2.5 mb-2">
              <Languages className="w-6 h-6" />
              <h3 className="text-base font-bold">Naija Lingo & Letter Crush</h3>
            </div>
            <p className="text-xs text-white/90 mb-4 leading-snug">
              Master official Nigerian curriculum Yoruba (Abidi Yoruba), Igbo, and Hausa alphabets through fun Candy Crush-style letter matching games!
            </p>
            <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 font-bold py-2.5 px-4 rounded-full text-center text-sm">
              Start Playing 🌍
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-5 shadow-md hover:scale-[1.02] active:scale-[0.99] transition-transform cursor-pointer text-white">
            <div className="flex items-center gap-2.5 mb-2">
              <GraduationCap className="w-6 h-6" />
              <h3 className="text-base font-bold">Smart Study & Revisions</h3>
            </div>
            <p className="text-xs text-white/90 mb-4 leading-snug">
              Generate instant summary notes, key formula flashcards, and practice past questions for Common Entrance, BECE, WAEC, and NECO exams.
            </p>
            <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 font-bold py-2.5 px-4 rounded-full text-center text-sm">
              Practice Now 📝
            </div>
          </div>

        </div>

        {/* Catch Up Program */}
        <div className="w-full rounded-3xl bg-white border-2 border-emerald-100 shadow-lg p-5 sm:p-6 mb-6">
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-1">
              <span className="inline-block bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2">
                Special Initiative
              </span>
              <h2 className="text-xl font-bold text-emerald-700 mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-400 fill-orange-400" />
                Catch Up Program
              </h2>
              <p className="text-sm font-semibold text-orange-500 italic">
                "It's Never Too Late to Learn!"
              </p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md">
              <img
                src="/assets/images/mama-titi-2.png"
                alt="Mama Titi"
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            For children who are currently out of school or need extra foundational support, Mama Titi guides you step-by-step through the NERDC curriculum path in your own native language.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> English (Active)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Yoruba (Active)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Igbo (Soon)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Hausa (Soon)
            </div>
          </div>

          <button
            onClick={onStartCatchingUp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 transition-all"
          >
            <span>Start Catching Up Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-xs text-slate-400 space-y-1">
          <p>No separate app download needed · Works on any phone or browser</p>
          <p className="text-[11px] text-slate-300">FunlyLearn © 2026 — Official NERDC Curriculum Companion</p>
        </div>

      </div>
    </div>
  );
};
