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
    <div className="min-h-screen bg-[#064E3B] text-white font-sans flex flex-col justify-between selection:bg-amber-300 selection:text-emerald-950">
      
      {/* Top Header Bar */}
      <header className="w-full bg-[#022C22]/90 backdrop-blur-md border-b border-emerald-800/80 sticky top-0 z-50 px-4 py-3">
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
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white block leading-tight">
                FunlyLearn
              </span>
              <span className="text-[10px] sm:text-xs text-amber-300 font-jakarta font-medium block">
                Official NERDC AI Companion
              </span>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-jakarta font-bold text-xs sm:text-sm shadow-md transition-all transform hover:scale-105"
          >
            Start Free 🚀
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 flex-1 flex flex-col items-center">

        {/* Hero Section */}
        <div className="w-full text-center space-y-6 pt-2 pb-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#022C22] border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-jakarta font-semibold text-amber-300 shadow-lg animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🇳🇬 #1 NERDC Curriculum AI Teacher for Nigerian Scholars</span>
          </div>

          {/* Hero Content Grid: Mama Titi Portrait + Main Headline */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center max-w-4xl mx-auto pt-2">
            
            {/* Left/Top: Official Mama Titi Card */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-[#022C22] p-3 rounded-3xl border-2 border-amber-400/60 shadow-2xl overflow-hidden flex flex-col items-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-inner">
                    <img
                      src="/assets/images/mama_titi_official.jpg"
                      alt="Mama Titi Official Teacher"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <h3 className="font-serif text-lg font-bold text-amber-300">Mama Titi</h3>
                    <p className="text-xs text-emerald-200 font-jakarta">Your 24/7 AI Nigerian Teacher</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right/Bottom: Headline, Description & CTAs */}
            <div className="md:col-span-7 text-center md:text-left space-y-4">
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Meet <span className="text-amber-300">Mama Titi!</span> 🇳🇬
              </h1>
              <p className="text-emerald-100 text-base sm:text-lg font-sans leading-relaxed">
                Step-by-step Primary 3 to SS3 curriculum help through fun Nigerian stories. Available 24/7 — no expensive private lesson teacher needed!
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={onStartLearning}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FF6B35] hover:bg-[#E85523] text-white font-jakarta font-bold text-base shadow-coral transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <span>Start Learning Free 🚀</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Stats Row */}
        <div className="w-full py-4 px-6 rounded-2xl bg-[#022C22]/90 border border-emerald-600/40 grid grid-cols-3 text-center my-4 gap-2 shadow-lg">
          <div className="space-y-0.5">
            <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center justify-center space-x-1">
              <Users className="w-4 h-4" />
              <span>1,480+</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">active scholars</p>
          </div>
          <div className="space-y-0.5 border-x border-emerald-700/60">
            <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center justify-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>P3 to SS3</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">NERDC subjects</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center justify-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>100% Free</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">to start today</p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          
          {/* Card 1: Homework & Story Teacher */}
          <div className="bg-[#022C22] p-5 rounded-3xl border border-emerald-700/50 shadow-soft hover:border-amber-400/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-1">📸 Homework Snap & Stories</h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                Snap any textbook question or type your topic. Mama Titi breaks down difficult concepts using relatable Nigerian stories and step-by-step examples.
              </p>
            </div>
          </div>

          {/* Card 2: Naija Lingo & Letter Crush */}
          <div className="bg-[#5B21B6] p-5 rounded-3xl border border-purple-400/30 shadow-soft hover:border-amber-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-900/80 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-1">🌍 Naija Lingo & Letter Crush</h3>
              <p className="text-xs text-purple-200 leading-relaxed font-sans">
                Master official Nigerian curriculum Yoruba (Abidi Yoruba), Igbo, and Hausa alphabets through fun Candy Crush-style letter matching games!
              </p>
            </div>
          </div>

          {/* Card 3: Smart Study Notebook */}
          <div className="bg-[#FEF3C7] p-5 rounded-3xl border border-amber-300 shadow-soft text-slate-900 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-1">📝 Smart Study & Revisions</h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Generate instant summary notes, key formula flashcards, and practice past questions for Common Entrance, BECE, WAEC, and NECO exams.
              </p>
            </div>
          </div>

        </div>

        {/* Out-Of-School Section: "It's Never Too Late to Learn" */}
        <div className="w-full my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#022C22] via-[#043E2E] to-[#011D16] border-2 border-amber-400/50 text-left relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Heart className="w-32 h-32 text-amber-300" />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-jakarta font-bold border border-amber-400/30">
              <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Catch Up Program</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">
              It's Never Too Late to Learn!
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 font-sans leading-relaxed">
              For children who are currently out of school or need extra foundational support, Mama Titi guides you step-by-step through the NERDC curriculum path in your own native language.
            </p>

            {/* Language status badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-800/90 text-white text-xs font-jakarta font-semibold flex items-center space-x-1 border border-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>English (Active)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-800/90 text-white text-xs font-jakarta font-semibold flex items-center space-x-1 border border-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Yoruba (Active)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300/80 text-xs font-jakarta font-medium border border-emerald-800">
                <span>Igbo (Coming Soon)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300/80 text-xs font-jakarta font-medium border border-emerald-800">
                <span>Hausa (Coming Soon)</span>
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={onStartCatchingUp}
                className="px-6 py-3 rounded-full bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs sm:text-sm font-jakarta font-bold shadow-coral flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <span>Start Catching Up Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>



        {/* Footer info notice */}
        <div className="py-6 text-center text-xs text-emerald-200/80 font-sans space-y-1">
          <p>No separate app download needed · Works on any phone or browser</p>
          <p className="text-[11px] text-emerald-300/60">FunlyLearn © 2026 — Official NERDC Curriculum Companion</p>
        </div>

      </div>
    </div>
  );
};

