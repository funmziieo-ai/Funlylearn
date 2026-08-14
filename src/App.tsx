import React, { useState, useEffect } from 'react';
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
  signOutUser
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
import { OnboardingPage } from './pages/OnboardingPage';
import { ChatPage } from './pages/ChatPage';
import { NaijaLingoPage } from './pages/NaijaLingoPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SmartNotebookPage } from './pages/SmartNotebookPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [view, setView] = useState<'landing' | 'auth' | 'onboarding' | 'app' | 'reset-password'>('landing');
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

  // Initialize Supabase Auth Session listener
  useEffect(() => {
    if (!supabase) return;

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
        }
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
    saveStoredProfile(profile);
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

    // 2. Fetch subscription
    const dbSub = await fetchSubscriptionFromSupabase(userId);
    if (dbSub) {
      setSubscription(dbSub);
    }
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setProfile(updated);
    saveStoredProfile(updated);
    const userId = user?.id || getOrCreateGuestSessionId();
    saveChildProfileToSupabase(updated, userId);
  };

  const handleStartLearning = () => {
    if (user || isGuest) {
      setView('onboarding');
    } else {
      setView('auth');
    }
  };

  const handleStartCatchingUp = () => {
    setProfile(prev => ({ ...prev, isOutOfSchool: true }));
    if (user || isGuest) {
      setView('onboarding');
    } else {
      setView('auth');
    }
  };

  const handleAuthSuccess = async (authUser: any) => {
    setUser(authUser);
    setIsGuest(false);
    await handlePostAuthFlow(authUser);
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    getOrCreateGuestSessionId();
    // Route to onboarding or chat app
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
    setView('landing');
  };

  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    handleProfileUpdate(updatedProfile);
    setView('app');
    setActiveTab(inviteTarget || 'chat');
  };

  const handleIncrementDailyMessages = () => {
    const newCount = incrementGuestDailyMessageCount();
    setDailyMessagesCount(newCount);
    return newCount;
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
          onNavigateLanding={() => setView('landing')}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenPricingModal={() => setIsPricingOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenVoiceKeyModal={() => setIsVoiceKeyModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'landing' && (
          <LandingPage
            onStartLearning={handleStartLearning}
            onStartCatchingUp={handleStartCatchingUp}
          />
        )}

        {view === 'auth' && (
          <AuthScreen
            onAuthSuccess={handleAuthSuccess}
            onContinueAsGuest={handleContinueAsGuest}
          />
        )}

        {view === 'reset-password' && (
          <ResetPasswordScreen
            onComplete={() => setView('auth')}
          />
        )}

        {view === 'onboarding' && (
          <OnboardingPage
            initialProfile={profile}
            onComplete={handleOnboardingComplete}
            onExit={() => setView('landing')}
          />
        )}

        {view === 'app' && (
          <>
            {(activeTab === 'home' || activeTab === 'chat') && (
              <ChatPage
                profile={profile}
                subscription={subscription}
                dailyMessagesCount={dailyMessagesCount}
                onIncrementDailyMessages={handleIncrementDailyMessages}
                onProfileUpdate={handleProfileUpdate}
                onOpenPricingModal={() => setIsPricingOpen(true)}
                isGuest={isGuest}
                userId={user?.id || getOrCreateGuestSessionId()}
              />
            )}

            {activeTab === 'lingo' && (
              <NaijaLingoPage
                profile={profile}
                onProfileUpdate={handleProfileUpdate}
                onOpenWordCrushPreview={() => setActiveTab('word_crush')}
              />
            )}

            {activeTab === 'word_crush' && (
              <NaijaWordCrush
                profile={profile}
                onBackToApp={() => setActiveTab('lingo')}
                isStandalonePreview={false}
              />
            )}

            {activeTab === 'board' && (
              <LeaderboardPage
                profile={profile}
                onGoToHomework={() => setActiveTab('chat')}
              />
            )}

            {activeTab === 'me' && (
              <ProfilePage
                profile={profile}
                subscription={subscription}
                userEmail={user?.email}
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
              />
            )}
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
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

    </div>
  );
}
