import React, { useState } from 'react';
import { Camera, GraduationCap, Languages, Trophy, Smartphone, Heart } from 'lucide-react';
import { UserProfile } from '../types';

// Real 3D illustrations (CC0-licensed, from 3dicons.co) load from the
// public/ folder as plain paths rather than bundler imports -- this is
// deliberate: an ES import of a missing file fails the ENTIRE build
// (exactly what happened when HomePage.tsx itself was briefly in the
// wrong folder), whereas a public/ path that doesn't exist yet just
// 404s quietly at runtime for that one image, caught below and
// swapped back to the plain Lucide icon automatically. Drop each PNG
// at public/illustrations/<name>.png whenever it's ready -- no code
// change needed, and nothing breaks in the meantime.

interface HomePageProps {
  profile: UserProfile;
  userId: string;
  onNavigate: (tab: string) => void;
  onProfileUpdate: (updated: UserProfile) => void;
}

// A real dashboard, not another route to the chat screen. Matches how
// every major kids-learning app (Duolingo, Khan Academy Kids, uLesson)
// structures Home: a greeting, progress at a glance, and clear cards
// into each major feature -- never a feature itself.
export const HomePage: React.FC<HomePageProps> = ({ profile, onNavigate, onProfileUpdate }) => {
  const isYoruba = profile.language === 'yo';
  const [failedIllustrations, setFailedIllustrations] = useState<Record<string, boolean>>({});

  const hour = new Date().getHours();
  const greeting = isYoruba
    ? 'Ẹ ku ọjọ'
    : hour < 12
    ? 'Good morning'
    : hour < 17
    ? 'Good afternoon'
    : 'Good evening';

  // Restyled per a colourful-card reference (flat solid background,
  // bold dark title, white stat pill showing a REAL number rather than
  // a decorative one) -- this is the code-only layer of that look.
  // The "bg" field is now a single flat Tailwind class, not a
  // gradient, and each card's pill is only shown when there's a
  // genuine stat to report for that feature; cards without one (like
  // Parents) simply omit the pill rather than showing a fake number.
  const featureCards = [
    {
      id: 'chat',
      title: isYoruba ? 'Ṣe Aworan Iṣẹ Ile' : 'Snap Homework',
      subtitle: isYoruba
        ? 'Ya aworan tabi kọ ibeere kan fun Mama Titi'
        : 'Photo a question or ask Mama Titi anything',
      icon: Camera,
      illustrationPath: '/illustrations/snap-homework.png',
      bg: 'bg-amber-400',
      pillValue: profile.coins || 0,
      pillLabel: isYoruba ? 'owó' : 'coins',
      pillColor: 'text-amber-600'
    },
    {
      id: 'notebook',
      title: isYoruba ? 'Múra Sílẹ̀ Fún Àyẹ̀wò' : 'Exam Prep',
      subtitle: isYoruba
        ? 'Ṣe àdánwò gidi fún BECE, WAEC àti FSLC'
        : 'Real practice for BECE, WAEC & FSLC',
      icon: GraduationCap,
      illustrationPath: '/illustrations/exam-prep.png',
      bg: 'bg-emerald-500',
      pillValue: profile.totalCorrect || 0,
      pillLabel: isYoruba ? 'tọ̀nà' : 'correct',
      pillColor: 'text-emerald-600'
    },
    {
      id: 'lingo',
      title: isYoruba ? 'Naija Lingo' : 'Naija Lingo',
      subtitle: isYoruba
        ? 'Kọ Yoruba nipasẹ ere igbadun'
        : 'Learn Yoruba through fun games',
      icon: Languages,
      illustrationPath: '/illustrations/naija-lingo.png',
      bg: 'bg-purple-500',
      pillValue: profile.lingoLevel || 1,
      pillLabel: isYoruba ? 'ipele' : 'level',
      pillColor: 'text-purple-600'
    },
    {
      id: 'board',
      title: isYoruba ? 'Táabù Olùdarí' : 'Leaderboard',
      subtitle: isYoruba
        ? 'Wo bí o ṣe wà láàrin àwọn akẹ́kọ̀ọ́ mìíràn'
        : 'See how you rank among other scholars',
      icon: Trophy,
      illustrationPath: '/illustrations/leaderboard.png',
      bg: 'bg-orange-500',
      pillValue: profile.stars,
      pillLabel: isYoruba ? 'ìràwọ̀' : 'stars',
      pillColor: 'text-orange-600'
    },
    {
      id: 'parent',
      title: isYoruba ? 'Àwọn Òbí' : 'Parents',
      subtitle: isYoruba
        ? 'Àkíyèsí àti ìtọ́sọ́nà fún àwọn òbí'
        : 'Updates and guidance for parents',
      icon: Smartphone,
      illustrationPath: '/illustrations/parents.png',
      bg: 'bg-sky-500',
      pillValue: null,
      pillLabel: '',
      pillColor: 'text-sky-600'
    },
    {
      id: 'catchup',
      title: isYoruba ? 'Kò Sí Ní Ilé-Ìwé Lọ́wọ́lọ́wọ́' : 'Not in School Right Now',
      subtitle: isYoruba
        ? 'Ẹ̀kọ́ tí a ṣe pàtàkì fún kíkó padà'
        : 'A structured catch-up path just for you',
      icon: Heart,
      illustrationPath: '/illustrations/catchup.png',
      bg: 'bg-rose-500',
      pillValue: null,
      pillLabel: '',
      pillColor: 'text-rose-600'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-28 font-sans">

      {/* Simple greeting card -- previously this also repeated
          Stars/Coins/Streak in a stats row, but each of those now
          already shows on its own feature card below (coins on Snap
          Homework, correct count on Exam Prep, level on Naija Lingo,
          stars on Leaderboard), so showing them again here was pure
          duplication. This card's only job now is the warm greeting. */}
      <div className="bg-[#0E8256] text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-800/30 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-emerald-100 font-sans">{greeting},</p>
          <h1 className="font-serif text-2xl font-bold text-white">
            {profile.name}!
          </h1>
        </div>
      </div>

      {/* Feature cards -- flat colour + bold dark title + real stat
          pill, matching the reference's structure. The large faint
          icon in the corner sits exactly where a real 3D illustration
          will drop in later, so no further layout change is needed
          once those assets exist -- just swap the icon for an <img>. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {featureCards.map((card) => {
          const Icon = card.icon;
          const imgFailed = failedIllustrations[card.id];
          const handleSelect = () => {
            if (card.id === 'catchup') {
              // Same flag the Landing Page's "Start Catching Up" CTA
              // sets during onboarding -- reusing it here so a child
              // who selects this later gets the same tailored framing,
              // then goes straight into chat with Mama Titi.
              onProfileUpdate({ ...profile, isOutOfSchool: true });
              onNavigate('chat');
            } else {
              onNavigate(card.id);
            }
          };
          return (
            <button
              key={card.id}
              onClick={handleSelect}
              className={`${card.bg} p-4 pb-3.5 rounded-3xl shadow-md text-left transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group min-h-[148px] flex flex-col justify-between`}
            >
              {/* Real 3D illustration once its file exists at
                  public/illustrations/<name>.png -- falls back to the
                  plain Lucide icon automatically if that file is
                  missing or fails to load, so nothing ever breaks or
                  shows a broken-image icon to a user. */}
              {!imgFailed ? (
                <img
                  src={card.illustrationPath}
                  alt=""
                  onError={() =>
                    setFailedIllustrations((prev) => ({ ...prev, [card.id]: true }))
                  }
                  className="absolute -right-2 -bottom-2 w-28 h-28 object-contain pointer-events-none"
                />
              ) : (
                <Icon className="absolute -right-3 -bottom-3 w-24 h-24 text-white/25 rotate-[-8deg] pointer-events-none" />
              )}

              <div className="relative z-10">
                <h3 className="font-serif font-extrabold text-lg text-slate-900 leading-tight">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-900/70 font-sans mt-1 leading-snug pr-8">
                  {card.subtitle}
                </p>
              </div>

              {card.pillValue !== null && (
                <div className="relative z-10 inline-flex items-center bg-white rounded-2xl px-3 py-1.5 shadow-sm w-fit mt-3">
                  <span className={`font-black text-lg ${card.pillColor}`}>{card.pillValue}</span>
                  <span className="text-[11px] font-jakarta font-bold text-slate-500 ml-1.5">
                    {card.pillLabel}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};
