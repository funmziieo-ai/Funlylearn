import React, { useState, useEffect } from 'react';
import { ArrowRight, Camera, GraduationCap, Languages, Heart, Star, Zap, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onStartLearning: () => void;
  onStartCatchingUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onStartCatchingUp
}) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    { name: 'Mrs Adeyemi', role: 'Parent, Lagos', text: 'My daughter went from failing Maths to top of her class in 3 weeks!', emoji: '👩🏾' },
    { name: 'Tunde', role: 'JSS 2, Ibadan', text: 'Mama Titi explains better than my teacher. I love the Nigerian stories!', emoji: '👦🏾' },
    { name: 'Mr Okafor', role: 'Parent, Abuja', text: 'No more expensive lesson teachers. FunlyLearn does it all!', emoji: '👨🏿' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(t => (t + 1) % testimonials.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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
            className="px-5 py-2 rounded-full bg-[#FF6B35] text-white font-black text-sm shadow-[0_4px_0_#c94e1f] active:shadow-none active:translate-y-1 transition-all"
          >
            Start Free
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">

        {/* HERO */}
        <section className="pt-8 pb-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">
              1,480+ Nigerian children learning right now
            </span>
          </div>

          {/* Mama Titi illustration placeholder with emoji */}
          <div className="relative mx-auto w-36 h-36 mb-6">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#00A651] to-[#005c2e] flex items-center justify-center shadow-2xl border-4 border-white">
              <span className="text-7xl">👩🏾‍🏫</span>
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md animate-bounce">
              <span className="text-lg">🇳🇬</span>
            </div>
            <div className="absolute -bottom-1 -left-2 bg-white rounded-full px-2 py-1 shadow-md border border-slate-100 flex items-center space-x-1">
              <span className="text-xs">🔊</span>
              <span className="text-[10px] font-bold text-slate-700">Idera Voice</span>
            </div>
          </div>

          <h1 className="font-black text-4xl sm:text-5xl text-slate-900 leading-tight mb-3 tracking-tight">
            Learn with<br />
            <span className="text-[#00A651]">Mama Titi</span>
          </h1>

          <p className="text-slate-500 text-base leading-relaxed mb-2 max-w-xs mx-auto">
            Nigeria's AI teacher for Primary 3 to SS3. Real Nigerian voice. Real NERDC curriculum.
          </p>

          <div className="flex items-center justify-center space-x-1 mb-7">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <span className="text-xs text-slate-500 ml-1 font-semibold">4.9 rating</span>
          </div>

          {/* BIG CTA button — Duolingo style */}
          <button
            onClick={onStartLearning}
            className="w-full py-5 rounded-2xl bg-[#00A651] hover:bg-[#008f46] text-white font-black text-xl shadow-[0_6px_0_#005c2e] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center space-x-3 mb-3"
          >
            <span>Start Learning FREE</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            onClick={onStartCatchingUp}
            className="w-full py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-base hover:border-[#00A651] hover:text-[#00A651] transition-all"
          >
            I am out of school — Catch Up Programme
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Free to start · No download needed · Works on any phone
          </p>
        </section>

        {/* SOCIAL PROOF STRIP */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { num: '1,480+', label: 'Active scholars', emoji: '👨‍🎓' },
            { num: 'P3–SS3', label: 'NERDC levels', emoji: '📚' },
            { num: '100%', label: 'Free to start', emoji: '🎉' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <div className="text-xl mb-1">{stat.emoji}</div>
              <div className="font-black text-lg text-slate-900">{stat.num}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section className="mb-8">
          <h2 className="font-black text-2xl text-slate-900 mb-4 text-center">
            How it works
          </h2>
          <div className="space-y-3">
            {[
              {
                step: '1',
                icon: '👦🏾',
                title: 'Tell Mama Titi your class',
                desc: 'Primary 3 to SS3. Mama Titi knows your exact NERDC curriculum.',
                color: 'bg-emerald-50 border-emerald-200'
              },
              {
                step: '2',
                icon: '📸',
                title: 'Snap or type your homework',
                desc: 'Photo your textbook question or type it. Mama Titi reads and explains it.',
                color: 'bg-amber-50 border-amber-200'
              },
              {
                step: '3',
                icon: '🎤',
                title: 'Mama Titi teaches in real Nigerian voice',
                desc: 'Idera voice sounds like a real Nigerian teacher not an American robot!',
                color: 'bg-purple-50 border-purple-200'
              },
              {
                step: '4',
                icon: '🏆',
                title: 'Earn coins and unlock Lingo games',
                desc: 'Answer correctly earn coins unlock Yoruba language games!',
                color: 'bg-orange-50 border-orange-200'
              },
            ].map((item, i) => (
              <div key={i} className={'flex items-start space-x-4 p-4 rounded-2xl border-2 ' + item.color}>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {item.step}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="mb-8">
          <h2 className="font-black text-2xl text-slate-900 mb-4 text-center">
            Everything your child needs
          </h2>
          <div className="grid grid-cols-1 gap-3">

            {/* Homework snap */}
            <div
              onClick={onStartLearning}
              className="bg-gradient-to-br from-[#FF6B35] to-[#c94e1f] rounded-3xl p-5 text-white cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">Homework Snap</h3>
                  <p className="text-xs text-orange-100">Photo any question get help instantly</p>
                </div>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-xs text-white/90 italic">
                "I can see in this photo a multiplication question. Tunde went to Balogun market..."
              </div>
              <div className="mt-3 flex items-center space-x-1 text-xs font-bold text-white/80">
                <Zap className="w-3.5 h-3.5" />
                <span>Powered by Gemini AI vision</span>
              </div>
            </div>

            {/* Naija Lingo */}
            <div
              onClick={onStartLearning}
              className="bg-gradient-to-br from-[#5B21B6] to-[#3B0764] rounded-3xl p-5 text-white cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">Naija Lingo Games</h3>
                  <p className="text-xs text-purple-200">Learn Yoruba with real Nigerian voice</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {['🇳🇬 Yoruba', '🔒 Igbo', '🔒 Hausa'].map((lang, i) => (
                  <span key={i} className={'text-[10px] font-bold px-2 py-1 rounded-full ' + (i === 0 ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white/60')}>
                    {lang}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center space-x-1 text-xs font-bold text-purple-300">
                <span>🔊</span>
                <span>Idera voice sounds genuinely Nigerian</span>
              </div>
            </div>

            {/* Exam prep */}
            <div
              onClick={onStartLearning}
              className="bg-gradient-to-br from-[#00A651] to-[#005c2e] rounded-3xl p-5 text-white cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">Exam Preparation</h3>
                  <p className="text-xs text-emerald-100">Common Entrance BECE WAEC JAMB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Common Entrance', 'BECE JSS3', 'WAEC SS3', 'JAMB'].map((exam, i) => (
                  <div key={i} className="bg-white/15 rounded-lg px-2 py-1.5 flex items-center space-x-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-300 shrink-0" />
                    <span className="text-[10px] font-bold text-white">{exam}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY FUNLYLEARN IS DIFFERENT */}
        <section className="mb-8 bg-slate-50 rounded-3xl p-5 border border-slate-100">
          <h2 className="font-black text-xl text-slate-900 mb-4 text-center">
            Why parents choose FunlyLearn
          </h2>
          <div className="space-y-3">
            {[
              { icon: '🎤', title: 'Real Nigerian voice not American accent', desc: 'Idera sounds like an actual Nigerian teacher your child recognises.' },
              { icon: '📖', title: 'Official NERDC curriculum only', desc: 'Every lesson follows the exact same curriculum as Nigerian schools.' },
              { icon: '🌙', title: 'Available 24 hours 7 days a week', desc: 'Homework help at 10pm no problem. Mama Titi never sleeps.' },
              { icon: '💰', title: 'Saves money on lesson teachers', desc: 'No more N5000 per hour private tutors. FunlyLearn is free to start.' },
              { icon: '🏆', title: 'Games that make learning fun', desc: 'Coins streaks lingo games keep children coming back every day.' },
              { icon: '🇳🇬', title: 'Built for Nigerian children', desc: 'Nigerian stories names food and culture in every explanation.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mb-8">
          <h2 className="font-black text-2xl text-slate-900 mb-4 text-center">
            What Nigerian families say
          </h2>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00A651] to-[#005c2e] p-6 text-white min-h-[140px]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={'absolute inset-0 p-6 flex flex-col justify-between transition-opacity duration-500 ' + (i === activeTestimonial ? 'opacity-100' : 'opacity-0')}
              >
                <p className="text-sm leading-relaxed italic text-emerald-50">
                  "{t.text}"
                </p>
                <div className="flex items-center space-x-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-emerald-200">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-2 mt-3">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={'w-2 h-2 rounded-full transition-all ' + (i === activeTestimonial ? 'bg-[#00A651] w-6' : 'bg-slate-300')}
              />
            ))}
          </div>
        </section>

        {/* CATCH UP PROGRAMME */}
        <section className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Heart className="w-5 h-5 text-[#FF6B35] fill-[#FF6B35]" />
            <span className="font-black text-base text-slate-900">Catch Up Programme</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold">Special</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Not currently in school? Mama Titi teaches the NERDC curriculum in your own language so you can catch up at your own pace.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'English', status: true },
              { label: 'Yoruba', status: true },
              { label: 'Igbo', status: false },
              { label: 'Hausa', status: false },
            ].map((lang, i) => (
              <div key={i} className={'flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold ' + (lang.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                <span className={'w-2 h-2 rounded-full ' + (lang.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
                <span>{lang.label}</span>
                {!lang.status && <span className="ml-auto text-[9px]">Soon</span>}
              </div>
            ))}
          </div>
          <button
            onClick={onStartCatchingUp}
            className="w-full py-4 rounded-2xl bg-[#FF6B35] text-white font-black text-base shadow-[0_4px_0_#c94e1f] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center space-x-2"
          >
            <span>Start Catching Up Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        {/* FINAL BIG CTA */}
        <section className="mb-10 text-center">
          <h2 className="font-black text-3xl text-slate-900 mb-2">
            Ready to start?
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Join 1,480+ Nigerian children learning with Mama Titi today.
          </p>
          <button
            onClick={onStartLearning}
            className="w-full py-5 rounded-2xl bg-[#00A651] hover:bg-[#008f46] text-white font-black text-xl shadow-[0_6px_0_#005c2e] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center space-x-3 mb-4"
          >
            <span>Start Learning FREE</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
            <span>✅ No credit card</span>
            <span>✅ No download</span>
            <span>✅ Free forever</span>
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
