import React from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import mamaTitiMain from '../assets/images/mama_titi_official_1784860280943.jpg';
import girlAvatar from '../assets/images/3d_nigerian_girl_avatar_1784829212783.jpg';
import boyAvatar from '../assets/images/3d_nigerian_boy_avatar_1784829225940.jpg';
import childAvatar from '../assets/images/3d_nigerian_child_avatar_1784829240662.jpg';

interface LandingPageProps {
  onStartLearning: () => void;
  onStartCatchingUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onStartCatchingUp
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-[#00A651] flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">
              Funly<span className="text-[#00A651]">Learn</span>
            </span>
          </div>
          <button
            onClick={onStartLearning}
            className="text-sm font-bold text-slate-500 hover:text-slate-800 underline"
          >
            Skip
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">

        {/* HERO */}
        <section className="pt-8 pb-6 text-center">

          {/* Mama Titi Big Image */}
          <div className="relative mx-auto w-44 h-44 mb-6">
            <img
              src={mamaTitiMain}
              alt="Mama Titi"
              className="w-44 h-44 rounded-full object-cover object-top border-4 border-white shadow-2xl"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md animate-bounce">
              <span className="text-xl">🇳🇬</span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#00A651] rounded-full px-3 py-1 shadow-md flex items-center space-x-1.5 whitespace-nowrap">
              <span className="text-xs">🔊</span>
              <span className="text-[11px] font-black text-white">Mama Titi Voice Active</span>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="font-black text-4xl sm:text-5xl text-slate-900 leading-tight mb-3 tracking-tight">
              Learn with<br />
              <span className="text-[#00A651]">Mama Titi</span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-7 max-w-xs mx-auto">
              Nigeria's AI teacher for Primary 3 to SS3. Real Nigerian voice. Real NERDC curriculum.
            </p>
          </div>

          {/* BIG CTA */}
          <button
            onClick={onStartLearning}
            className="w-full py-5 rounded-2xl bg-[#00A651] hover:bg-[#008f46] text-white font-black text-xl shadow-[0_6px_0_#005c2e] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center space-x-3 mb-3"
          >
            <span>Start Learning FREE</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Free to start · Works on any phone
          </p>
        </section>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { num: 'P3–SS3', label: 'NERDC levels', emoji: '📚' },
            { num: '100%', label: 'Free to start', emoji: '🎉' },
            { num: '24/7', label: 'Always available', emoji: '🌙' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <div className="text-xl mb-1">{stat.emoji}</div>
              <div className="font-black text-base text-slate-900">{stat.num}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section className="mb-10">
          <h2 className="font-black text-2xl text-slate-900 mb-6 text-center">
            How Mama Titi teaches
          </h2>
          <div className="space-y-4">

            {/* Step 1 */}
            <div className="flex items-center space-x-4 bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-4 overflow-hidden">
              <img
                src={girlAvatar}
                alt="Nigerian child studying"
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-md"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Step 1</span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">Tell Mama Titi your class</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Primary 3 to SS3. Mama Titi knows your exact NERDC topics and exam format.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center space-x-4 bg-amber-50 border-2 border-amber-200 rounded-3xl p-4">
              <img
                src={boyAvatar}
                alt="Nigerian boy snapping homework"
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-md"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Step 2</span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">Snap or type your homework</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Take a photo of your textbook question or type it. Mama Titi reads it and gets to work immediately.
                </p>
              </div>
            </div>

            {/* Step 3 — Story example */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-3xl p-4">
              <div className="mb-3">
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Step 3</span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">Mama Titi teaches through Nigerian stories</h3>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-purple-100">
                <p className="text-xs text-slate-500 italic mb-2">Instead of a boring explanation Mama Titi says:</p>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  "Tunde went to Balogun market with 500 Naira. He bought eba for 200 Naira. How much change did Tunde collect from the market woman?"
                </p>
                <p className="text-[10px] text-purple-600 font-bold mt-2">
                  Every lesson feels like home 🇳🇬
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center space-x-4 bg-orange-50 border-2 border-orange-200 rounded-3xl p-4">
              <img
                src={childAvatar}
                alt="Nigerian child playing lingo game"
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-md"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Step 4</span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">Earn coins and unlock Yoruba games</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Answer correctly to earn coins, then unlock Naija Lingo — flash cards, listen-and-pick, and speed rounds, each with a real Nigerian cultural note. Igbo and Hausa coming soon.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-center space-x-4 bg-teal-50 border-2 border-teal-200 rounded-3xl p-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-500 flex items-center justify-center shrink-0 shadow-md">
                <GraduationCap className="w-9 h-9 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Step 5</span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">Walk into exams ready</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mama Titi knows exactly what Common Entrance, BECE, and WAEC require, with the right format and practice questions for each one.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE FUNLYLEARN */}
        <section className="mb-10 bg-slate-50 rounded-3xl p-5 border border-slate-100">
          <h2 className="font-black text-2xl text-slate-900 mb-5 text-center">
            Why parents choose FunlyLearn
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: '🎤',
                title: 'Real Nigerian voice',
                desc: 'Mama Titi speaks the way Nigerian teachers speak. Your child will recognise the warmth immediately.'
              },
              {
                icon: '📖',
                title: 'Official NERDC curriculum only',
                desc: 'Every single lesson follows the exact curriculum Nigerian schools use. Nothing foreign nothing extra.'
              },
              {
                icon: '🌙',
                title: 'Available 24 hours 7 days a week',
                desc: 'Homework help at 10pm Sunday night before Monday\'s test? No problem. Mama Titi never sleeps.'
              },
              {
                icon: '🏆',
                title: 'Games that make children come back',
                desc: 'Coins streaks and word games make learning feel like play. Children ask to use FunlyLearn not the other way around.'
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3D children row at bottom */}
          <div className="flex items-center justify-center space-x-3 mt-6 pt-5 border-t border-slate-200">
            <img src={girlAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <img src={boyAvatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md -mx-2 z-10" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <img src={childAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="ml-3">
              <p className="font-black text-sm text-slate-900">Nigerian children</p>
              <p className="text-xs text-slate-500">Primary 3 to SS3</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-slate-100">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#00A651] flex items-center justify-center">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className="font-black text-slate-900">FunlyLearn</span>
          </div>
          <p className="text-xs text-slate-400 mb-1">
            Official NERDC Curriculum AI Companion for Nigerian Scholars
          </p>
          <p className="text-xs text-slate-300">
            © 2026 FunlyLearn · Made with 🇳🇬 for Nigerian children everywhere
          </p>
        </footer>
      </div>
    </div>
  );
};
