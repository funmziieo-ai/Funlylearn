import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserSubscription } from './types';
import { getStoredProfile, saveStoredProfile, DEFAULT_USER } from './services/apiClient';
import {
  supabase,
  getStoredSubscription,
  getGuestDailyMessageCount,
  incrementGuestDailyMessageCount,
  getOrCreateGuestSessionId,
  fetchChildProfile,
  saveChildProfileToSupabase,
  fetchSubscriptionFromSupabase,
  signOutUser,
  setUsageUserKey,
  syncDailyUsage,
  useDailyCredit,
  trialSubscription,
  hasPaidSubscription,
  resetGuestSessionId,
  getPlanStage,
  setUsageStage
} from './services/supabaseService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { FeedbackForm } from './components/FeedbackForm';
import { PricingModal } from './components/PricingModal';
import { ScholarProfileModal } from './components/ScholarProfileModal';
import { VoiceKeyModal } from './components/VoiceKeyModal';
import { NaijaWordCrush } from './components/NaijaWordCrush';
import { LandingPage } from './pages/LandingPage';
import { AppStartPage } from './pages/AppStartPage';
import { setupAppChrome, onPhoneBackButton, closeApp } from './utils/native';
import { OnboardingPage } from './pages/OnboardingPage';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { NaijaLingoPage } from './pages/NaijaLingoPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SmartNotebookPage } from './pages/SmartNotebookPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ProfilePage } from './pages/ProfilePage';

// A profile only counts as "real" once onboarding has genuinely given
// it a name — the onboarding form's Continue button is disabled until
// something is typed, so any profile with a real name here reflects a
// person who actually went through onboarding, not a blank session
// created just by loading the page. Used to gate every write to
// Supabase below, so a bare page visit (landing page, someone who
// bounces immediately) never creates a ghost row in child_profiles.
// True inside the FunlyLearn Android/iPhone app. The app adds
// "FunlyLearnApp" to its browser identity (appendUserAgent in the
// Capacitor settings), so the site can skip the marketing homepage and
// behave like an app.
const IS_NATIVE_APP = typeof navigator !== 'undefined' && navigator.userAgent.includes('FunlyLearnApp');
// Where "back to start" goes: the homepage on the website, sign-in in the app.
const START_VIEW = IS_NATIVE_APP ? 'start' : 'landing';

function hasRealName(p: UserProfile): boolean {
  return Boolean(p.name && p.name.trim().length > 0);
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [view, setView] = useState<'splash' | 'start' | 'landing' | 'auth' | 'onboarding' | 'app' | 'reset-password' | 'welcome-back'>(IS_NATIVE_APP ? 'splash' : 'landing');
  // A guest's saved profile found online after they signed out, waiting
  // for them to confirm it's them.
  const [returningGuest, setReturningGuest] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');

  // If someone opened the app via an invite link (e.g. ?invite=word_crush),
  // remember where they should land once they're through auth/onboarding,
  // instead of dropping them on the generic home/chat tab.
  const [inviteTarget] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    return invite === 'word_crush' || invite === 'lingo' ? invite : null;
  });

  // A direct feedback link (e.g. ?feedback=1) shows the feedback form
  // immediately, bypassing the normal landing/auth/app flow entirely —
  // no sign-in needed to leave feedback.
  const [showFeedbackForm] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('feedback') === '1';
  });

  // Authentication & Subscription States
  const [user, setUser] = useState<any | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<UserSubscription>(() => getStoredSubscription());
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isVoiceKeyModalOpen, setIsVoiceKeyModalOpen] = useState<boolean>(false);
  const [dailyMessagesCount, setDailyMessagesCount] = useState<number>(() => getGuestDailyMessageCount().count);

  // Inside the app: green status bar, hide the splash screen, and make
  // the phone's back button behave like an app (back to Home, then close).
  const backStateRef = useRef({ view, activeTab, isPricingOpen });
  backStateRef.current = { view, activeTab, isPricingOpen };
  useEffect(() => {
    if (!IS_NATIVE_APP) return;
    setupAppChrome();
    return onPhoneBackButton(() => {
      const { view: v, activeTab: tab, isPricingOpen: pricingOpen } = backStateRef.current;
      if (pricingOpen) {
        setIsPricingOpen(false);
      } else if (v === 'app' && tab !== 'home') {
        setActiveTab('home');
      } else {
        closeApp();
      }
    });
  }, []);

  // Inside the app: no text-selection highlights, no grey tap flash and
  // no page bounce, so it feels like an app rather than a website.
  useEffect(() => {
    if (!IS_NATIVE_APP) return;
    document.documentElement.classList.add('funlylearn-app');
    const style = document.createElement('style');
    style.textContent = `
      html.funlylearn-app, html.funlylearn-app body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
      html.funlylearn-app body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      html.funlylearn-app input, html.funlylearn-app textarea, html.funlylearn-app [contenteditable] { -webkit-user-select: text; user-select: text; }
    `;
    document.head.appendChild(style);
  }, []);

  // Daily free uses are counted per child: their account id when signed
  // in, otherwise this device's guest id. Re-sync whenever that changes.
  useEffect(() => {
    const key = user?.id || (isGuest || hasRealName(profile) ? getOrCreateGuestSessionId() : null);
    setUsageUserKey(key);
    if (key) {
      syncDailyUsage().then(() => setDailyMessagesCount(getGuestDailyMessageCount().count));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isGuest]);

  // Tell the usage counter which allowance applies today: trial (5 a day)
  // or free (2 chats a day).
  useEffect(() => {
    setUsageStage(getPlanStage(subscription));
  }, [subscription]);

  // Free trial: 7 days from when the child's profile was created. A paid
  // plan always wins.
  const applyTrialIfUnpaid = (p: UserProfile) => {
    setSubscription(current => (hasPaidSubscription(current) ? current : trialSubscription(p.createdAt)));
  };

  // Initialize Supabase Auth Session listener
  useEffect(() => {
    if (!supabase) {
      if (IS_NATIVE_APP) setView('start');
      return;
    }

    // Detect a password recovery link directly from the URL, before
    // either auth path below runs. A recovery link creates a real,
    // valid Supabase session — so getSession() below would otherwise
    // treat it as a normal sign-in and race ahead to onboarding/app
    // before the PASSWORD_RECOVERY event listener even fires.
    const isPasswordRecovery =
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery');

    if (isPasswordRecovery) {
      setView('reset-password');
    }

    // Check existing session — skipped for recovery links, since we
    // never want a recovery session routed into onboarding/app.
    if (!isPasswordRecovery) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          handlePostAuthFlow(session.user);
        } else if (inviteTarget) {
          enterGameAsGuest();
        } else if (IS_NATIVE_APP) {
          // In the app: returning children go straight in; new ones sign up.
          if (hasRealName(profile)) {
            enterAppAsGuest();
          } else {
            setView('start');
          }
        }
      }).catch(() => {
        if (IS_NATIVE_APP) setView('start');
      });
    }

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Kept as a backup signal in addition to the URL check above —
      // without this, it would silently fall through to the normal
      // sign-in path and skip the actual password-change step.
      if (_event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
        return;
      }
      if (isPasswordRecovery) {
        // Already showing the reset screen for this load — don't let
        // a session-restored event pull the user away from it.
        return;
      }
      if (session?.user) {
        setUser(session.user);
        handlePostAuthFlow(session.user);
      } else if (!isGuest) {
        setUser(null);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Always safe to keep in localStorage regardless of completeness —
    // this is just this browser's own local cache, not shared data.
    saveStoredProfile(profile);

    // Only write to Supabase once onboarding has genuinely given this
    // profile a real name. Without this guard, this effect fired on
    // EVERY page load — including a visitor who never got past the
    // landing page — immediately minting a guest session id and
    // writing a blank-name row into child_profiles. That's what was
    // actually filling up the leaderboard with empty "Scholar" ghosts,
    // not real guest usage.
    if (!hasRealName(profile)) return;

    const userId = user?.id || getOrCreateGuestSessionId();
    saveChildProfileToSupabase(profile, userId);
  }, [profile, user]);

  const handlePostAuthFlow = async (authUser: any) => {
    const userId = authUser.id;
    // 1. Fetch child profile from Supabase
    const dbProfile = await fetchChildProfile(userId);
    if (dbProfile) {
      setProfile(dbProfile);
      saveStoredProfile(dbProfile);
      setView('app');
      if (inviteTarget) setActiveTab(inviteTarget);
    } else {
      // New user without profile -> go to onboarding
      setView('onboarding');
    }

    // 2. Fetch subscription (no paid plan = 7-day trial from profile creation)
    const dbSub = await fetchSubscriptionFromSupabase(userId);
    if (dbSub && hasPaidSubscription(dbSub)) {
      setSubscription(dbSub);
    } else if (dbProfile) {
      setSubscription(trialSubscription(dbProfile.createdAt));
    }
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setProfile(updated);
    saveStoredProfile(updated);
    // Same guard as the effect above — this function is called
    // directly from several pages (coin/star updates, settings
    // changes) and would otherwise bypass that protection entirely.
    if (!hasRealName(updated)) return;
    const userId = user?.id || getOrCreateGuestSessionId();
    saveChildProfileToSupabase(updated, userId);
  };

  const handleStartLearning = () => {
    if (user || isGuest) {
      // A returning user/guest with a real saved profile should go
      // straight into the app, not back through onboarding again —
      // this was previously unconditional, which is exactly what sent
      // returning users through the "What class are you in?" screen
      // every single time instead of just once.
      setView(hasRealName(profile) ? 'app' : 'onboarding');
      if (hasRealName(profile)) setActiveTab(inviteTarget || 'home');
    } else {
      setAuthMode('signup');
      setView('auth');
    }
  };

  // In the app, a child who has used FunlyLearn on this phone goes
  // straight to Home, with no homepage and no sign-in screen.
  const enterAppAsGuest = () => {
    setIsGuest(true);
    getOrCreateGuestSessionId();
    applyTrialIfUnpaid(profile);
    setView('app');
    setActiveTab('home');
  };

  // Game invite links open the game directly as a guest: no homepage,
  // no forms. The game shows a short, optional "What's your name?" card.
  const enterGameAsGuest = () => {
    setIsGuest(true);
    getOrCreateGuestSessionId();
    applyTrialIfUnpaid(profile);
    setView('app');
    setActiveTab(inviteTarget || 'lingo');
  };

  // Which tab the sign-in screen opens on: Log in or Create account.
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // "Log in" always shows the sign-in form, even on a phone that was
  // used as a guest, so a guest can log into their real account.
  const handleLogIn = () => {
    setAuthMode('signin');
    setView('auth');
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setView('auth');
  };

  const handleStartCatchingUp = () => {
    setProfile(prev => ({ ...prev, isOutOfSchool: true }));
    if (user || isGuest) {
      setView(hasRealName(profile) ? 'app' : 'onboarding');
    } else {
      setView('auth');
    }
  };

  const handleAuthSuccess = async (authUser: any) => {
    setUser(authUser);
    setIsGuest(false);
    await handlePostAuthFlow(authUser);
  };

  const handleContinueAsGuest = async () => {
    setIsGuest(true);
    setUser(null);
    const guestId = getOrCreateGuestSessionId();
    // Onboarding only ever runs once per profile — a returning guest
    // goes straight into the app.
    if (hasRealName(profile)) {
      applyTrialIfUnpaid(profile);
      setView('app');
      // Someone who opened a game invite link lands straight in the games.
      setActiveTab(inviteTarget || 'home');
      return;
    }
    // Signing out clears the profile from this phone, but a guest's
    // profile is still saved online under this device's guest id. Look
    // for it so they don't have to type their name again.
    const saved = await fetchChildProfile(guestId);
    if (saved && hasRealName(saved)) {
      setReturningGuest(saved);
      setView('welcome-back');
    } else {
      setView('onboarding');
    }
  };

  const handleWelcomeBackYes = () => {
    if (!returningGuest) return;
    setProfile(returningGuest);
    saveStoredProfile(returningGuest);
    applyTrialIfUnpaid(returningGuest);
    setReturningGuest(null);
    setView('app');
    setActiveTab(inviteTarget || 'home');
  };

  // A different child on the same phone: give them their own guest id
  // and a fresh start, without touching the other child's saved profile.
  const handleWelcomeBackNew = () => {
    resetGuestSessionId();
    setUsageUserKey(getOrCreateGuestSessionId());
    setReturningGuest(null);
    setView('onboarding');
  };


  const handleSignOut = async () => {
    // Always clear local state, even if the remote sign-out call fails
    // for any reason (network hiccup, Supabase timeout). Previously, a
    // failure here left the user stuck "signed in" with no way out, and
    // meant the next sign-in couldn't properly load fresh account data
    // since the app never actually left the old session state.
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Remote sign-out failed, clearing local session anyway:', err);
    }
    // Also reset the actual profile (name, coins, stars, etc.) — sign
    // out was previously only clearing who's logged in, leaving the
    // old profile's name and data sitting in memory and in local
    // storage for whoever uses the app next.
    const freshProfile = { ...DEFAULT_USER, id: 'guest-' + Date.now(), createdAt: new Date().toISOString() };
    setProfile(freshProfile);
    saveStoredProfile(freshProfile);
    setUser(null);
    setIsGuest(false);
    setView(START_VIEW);
  };

  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    handleProfileUpdate(updatedProfile);
    applyTrialIfUnpaid(updatedProfile);
    setView('app');
    setActiveTab(inviteTarget || 'chat');
  };

  const handleIncrementDailyMessages = () => {
    const newCount = incrementGuestDailyMessageCount();
    setDailyMessagesCount(newCount);
    return newCount;
  };

  // Uses one of today's free Mama Titi chats, checked on the server.
  const handleUseDailyMessage = async (): Promise<boolean> => {
    const result = await useDailyCredit('chat');
    setDailyMessagesCount(result.used);
    return result.allowed;
  };

  // Feedback form bypasses the entire normal flow — no sign-in needed.
  if (showFeedbackForm) {
    return <FeedbackForm />;
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-slate-900 flex flex-col font-sans selection:bg-[#FF6B35] selection:text-white">
      
      {/* Top Navbar when inside the main app view */}
      {view === 'app' && (
        <Navbar
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
          onNavigateLanding={() => setView(START_VIEW)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'splash' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF8EC]">
            <style>{`
              @keyframes fl-load { 0% { transform: translateX(-100%) } 100% { transform: translateX(250%) } }
              .fl-load { animation: fl-load 1.3s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) { .fl-load { animation: none; transform: none; width: 100% !important; } }
            `}</style>
            <p className="font-['Fredoka'] text-5xl font-bold tracking-tight text-slate-900">
              Funly<span className="text-[#15803D]">Learn</span>
            </p>
            <div className="mt-5 w-40 h-1.5 rounded-full bg-[#15803D]/15 overflow-hidden" role="progressbar" aria-label="Loading">
              <div className="fl-load h-full w-2/5 rounded-full bg-[#15803D]" />
            </div>
          </div>
        )}

        {view === 'start' && (
          <AppStartPage onStart={handleSignUp} onLogIn={handleLogIn} />
        )}

        {view === 'landing' && (
          <LandingPage
            onStartLearning={handleStartLearning}
            onStartCatchingUp={handleStartCatchingUp}
            onLogIn={handleLogIn}
            onSignUp={handleSignUp}
          />
        )}

        {view === 'auth' && (
          <AuthScreen
            key={authMode}
            initialMode={authMode}
            onAuthSuccess={handleAuthSuccess}
            onContinueAsGuest={handleContinueAsGuest}
            onBack={() => setView(START_VIEW)}
          />
        )}

        {view === 'reset-password' && (
          <ResetPasswordScreen
            onComplete={() => setView('auth')}
          />
        )}

        {view === 'welcome-back' && returningGuest && (
          <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-sm w-full rounded-[28px] bg-white border-2 border-slate-200 border-b-8 p-6 text-center space-y-4 shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFC83D] text-[#064E3B] flex items-center justify-center text-4xl font-bold border-b-4 border-[#E0A800]">
                {returningGuest.name.trim().charAt(0).toUpperCase()}
              </div>
              <p className="font-serif text-3xl font-bold text-[#064E3B]">Welcome back, {returningGuest.name}! 👋</p>
              <p className="text-slate-600 font-semibold">
                {returningGuest.classLevel} · ⭐ {returningGuest.stars} stars · 🪙 {returningGuest.coins || 0} coins
              </p>
              <button
                onClick={handleWelcomeBackYes}
                className="w-full py-4 rounded-2xl bg-[#16A34A] text-white text-lg font-bold border-b-[5px] border-[#064E3B] transition-transform active:translate-y-[3px]"
              >
                ▶ Continue as {returningGuest.name}
              </button>
              <button
                onClick={handleWelcomeBackNew}
                className="w-full py-3 rounded-2xl bg-white text-slate-700 font-bold border-2 border-b-[5px] border-slate-300 transition-transform active:translate-y-[3px]"
              >
                I'm someone new
              </button>
            </div>
          </div>
        )}

        {view === 'onboarding' && (
          <OnboardingPage
            initialProfile={profile}
            onComplete={handleOnboardingComplete}
            onExit={() => setView(START_VIEW)}
          />
        )}

        {view === 'app' && (
          <>
            {activeTab === 'home' && (
              <HomePage
                profile={profile}
                userId={user?.id || getOrCreateGuestSessionId()}
                onNavigate={setActiveTab}
                onProfileUpdate={handleProfileUpdate}
              />
            )}

            {activeTab === 'search' && (
              <SearchPage
                profile={profile}
                userId={user?.id || getOrCreateGuestSessionId()}
                onNavigateToExamPrep={() => setActiveTab('notebook')}
              />
            )}

            {activeTab === 'chat' && (
              <ChatPage
                profile={profile}
                subscription={subscription}
                dailyMessagesCount={dailyMessagesCount}
                onIncrementDailyMessages={handleIncrementDailyMessages}
                onUseDailyMessage={handleUseDailyMessage}
                onProfileUpdate={handleProfileUpdate}
                onOpenPricingModal={() => setIsPricingOpen(true)}
                isGuest={isGuest}
                userId={user?.id || getOrCreateGuestSessionId()}
                activeTab={activeTab}
              />
            )}

            {activeTab === 'lingo' && (
              <NaijaLingoPage
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                onOpenWordCrushPreview={() => setActiveTab('word_crush')}
                userId={user?.id || getOrCreateGuestSessionId()}
              />
            )}

            {activeTab === 'word_crush' && (
              <NaijaWordCrush
                profile={profile}
                onBackToApp={() => setActiveTab('lingo')}
                isStandalonePreview={false}
                onProfileUpdate={handleProfileUpdate}
              />
            )}

            {activeTab === 'board' && (
              <LeaderboardPage
                profile={profile}
                onGoToHomework={() => setActiveTab('chat')}
                userId={user?.id || getOrCreateGuestSessionId()}
              />
            )}

            {activeTab === 'me' && (
              <ProfilePage
                profile={profile}
                subscription={subscription}
                userEmail={user?.email}
                userId={user?.id || getOrCreateGuestSessionId()}
                onProfileUpdate={handleProfileUpdate}
                onOpenPricingModal={() => setIsPricingOpen(true)}
                onSignOut={handleSignOut}
                onOpenNotebook={() => setActiveTab('notebook')}
                onOpenParentDashboard={() => setActiveTab('parent')}
              />
            )}

            {activeTab === 'notebook' && (
              <SmartNotebookPage
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                userId={user?.id || getOrCreateGuestSessionId()}
                subscription={subscription}
                onOpenPricingModal={() => setIsPricingOpen(true)}
              />
            )}

            {activeTab === 'parent' && (
              <ParentDashboardPage
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                userId={user?.id || getOrCreateGuestSessionId()}
                subscription={subscription}
                onOpenPricingModal={() => setIsPricingOpen(true)}
              />
            )}

            {activeTab === 'feedback' && <FeedbackForm />}
          </>
        )}
      </main>

      {/* Pricing / Upgrade Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        profile={profile}
        currentSubscription={subscription}
        onSubscriptionUpdated={(newSub) => setSubscription(newSub)}
        userEmail={user?.email || 'scholar@funlylearn.ng'}
        userId={user?.id || getOrCreateGuestSessionId()}
      />

      {/* Scholar Profile Settings Modal */}
      <ScholarProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        userEmail={user?.email}
        onProfileUpdate={handleProfileUpdate}
        onSignOut={handleSignOut}
      />

      {/* YarnGPT Voice Secret Key Modal */}
      <VoiceKeyModal
        isOpen={isVoiceKeyModalOpen}
        onClose={() => setIsVoiceKeyModalOpen(false)}
      />

      {/* Bottom Navigation Bar */}
      {view === 'app' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenPricingModal={() => setIsPricingOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />
      )}

    </div>
  );
}
