import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, UserSubscription, SubscriptionPlan } from '../types';
import { openPaystackCheckout } from '../services/paystackService';
import { checkSubscriptionStatus, getPlanStage, dailyLimitFor, getLocalUsage } from '../services/supabaseService';
import { Emoji3D } from './Emoji3D';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentSubscription?: UserSubscription;
  onSubscriptionUpdated: (newSub: UserSubscription) => void;
  userEmail?: string;
  userId?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentSubscription,
  onSubscriptionUpdated,
  userEmail = 'scholar@funlylearn.ng',
  userId = 'guest-id'
}) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [successPlan, setSuccessPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  if (!isOpen) return null;

  // Naira only for now -- GBP/UK and USD/Diaspora removed until real,
  // currency-adjusted pricing is worked out, rather than shipping the
  // placeholder same-nominal-number pricing that was there before.
  const handleSubscribe = async (plan: 'basic' | 'family') => {
    setIsLoadingPlan(plan);
    setPaymentError(null);

    const amount =
      plan === 'basic'
        ? billingInterval === 'monthly' ? 600000 : 4320000
        : billingInterval === 'monthly' ? 1200000 : 8640000;

    openPaystackCheckout({
      email: userEmail,
      amount,
      plan,
      userId,
      childName: profile.name,
      classLevel: profile.classLevel,
      currency: 'NGN',
      onSuccess: async (ref) => {
        setIsLoadingPlan(null);
        setIsConfirmingPayment(true);
        await waitForRealConfirmation(plan, ref);
      },
      onCancel: () => {
        setIsLoadingPlan(null);
      },
      onError: (detail: string) => {
        setIsLoadingPlan(null);
        setPaymentError(
          `We could not open the payment window. Details: ${detail}`
        );
      }
    });
  };

  const waitForRealConfirmation = async (plan: SubscriptionPlan, reference: string) => {
    const maxAttempts = 10;
    const delayMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const confirmedSub = await checkSubscriptionStatus(userId, reference);
      if (confirmedSub) {
        setIsConfirmingPayment(false);
        onSubscriptionUpdated(confirmedSub);
        setSuccessPlan(plan);
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, zIndex: 9999, colors: ['#16A34A', '#FFC83D', '#FF6B35', '#38BDF8', '#A855F7'] });
        return;
      }
    }

    setIsConfirmingPayment(false);
    setPendingConfirmation(true);
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      `Hi FunlyLearn! I need help choosing a subscription plan for my child in ${profile.classLevel}`
    );
    window.open(`https://wa.me/2347033267197?text=${message}`, '_blank');
  };

  // Where the child is right now: free trial (with days left), free
  // plan, or paid -- shown at the top so parents know exactly what's
  // happening today.
  const stage = getPlanStage(currentSubscription);
  const trialDaysLeft = stage === 'trial' && currentSubscription?.expiresAt
    ? Math.max(1, Math.ceil((new Date(currentSubscription.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const chatLimit = dailyLimitFor('chat', stage);
  const chatsUsed = Math.min(getLocalUsage('chat'), Number.isFinite(chatLimit) ? chatLimit : Infinity);
  const yearly = billingInterval === 'yearly';
  const FUN = "font-['Fredoka']";
  const PRESS = 'transition-transform active:translate-y-[4px]';
  const currentPlan = currentSubscription?.plan || 'free';

  const Feature: React.FC<{ emoji: string; children: React.ReactNode }> = ({ emoji, children }) => (
    <li className="flex items-center gap-3">
      <Emoji3D emoji={emoji} className="w-8 h-8 shrink-0" />
      <span>{children}</span>
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-16 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-['Nunito']"
      onClick={e => {
        // Tapping the dark area outside the plans closes them.
        if (e.target === e.currentTarget && !isConfirmingPayment) onClose();
      }}
    >
      {/* Always on screen, even after scrolling down to the plans. */}
      {!isConfirmingPayment && (
        <button
          onClick={onClose}
          aria-label="Go back"
          className="fixed top-3 left-3 z-[60] px-4 py-2.5 rounded-2xl bg-white text-[#064E3B] font-bold shadow-xl transition-transform active:translate-y-[3px]"
        >
          ◀ Back
        </button>
      )}
      <div className="relative w-full max-w-5xl rounded-[32px] overflow-hidden bg-white shadow-2xl my-6 animate-fadeIn">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 text-white font-bold"
        >
          ✕
        </button>

        {isConfirmingPayment ? (
          <div className="bg-gradient-to-br from-[#16A34A] via-[#0E8256] to-[#064E3B] text-white p-8 sm:p-12 text-center space-y-5">
            <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mx-auto">
              <Loader2 className="w-12 h-12 text-[#FFC83D] animate-spin" />
            </div>
            <h2 className={`${FUN} text-3xl font-bold`}>Confirming your payment...</h2>
            <p className="text-emerald-100 font-semibold max-w-md mx-auto">
              This usually only takes a few seconds. Please don't close this window.
            </p>
          </div>
        ) : pendingConfirmation ? (
          <div className="bg-gradient-to-br from-[#16A34A] via-[#0E8256] to-[#064E3B] text-white p-8 sm:p-12 text-center space-y-5">
            <Emoji3D emoji="⏳" className="w-24 h-24 mx-auto" />
            <h2 className={`${FUN} text-3xl font-bold`}>Still confirming...</h2>
            <p className="text-emerald-100 font-semibold max-w-md mx-auto">
              Your payment may still be processing. If it went through, your access will unlock automatically within a few minutes, so there's no need to pay again. If you're unsure, our team can check for you on WhatsApp.
            </p>
            <button
              onClick={handleWhatsAppSupport}
              className={`${FUN} ${PRESS} inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-lg font-bold border-b-[5px] border-[#E0A800]`}
            >
              <Emoji3D emoji="💬" className="w-7 h-7" /> Check on WhatsApp
            </button>
            <div>
              <button
                onClick={() => {
                  setPendingConfirmation(false);
                  onClose();
                }}
                className="text-sm text-emerald-200 underline font-semibold"
              >
                Close for now
              </button>
            </div>
          </div>
        ) : successPlan ? (
          <div className="bg-gradient-to-br from-[#16A34A] via-[#0E8256] to-[#064E3B] text-white p-8 sm:p-12 text-center space-y-4 animate-scaleUp">
            <Emoji3D emoji="🎉" className="w-28 h-28 mx-auto animate-bounce" />
            <span className={`${FUN} inline-block px-4 py-1 rounded-full bg-[#FFC83D] text-[#064E3B] font-bold`}>Payment successful</span>
            <h2 className={`${FUN} text-4xl font-bold`}>Welcome to {successPlan === 'family' ? 'Family' : 'Basic'}!</h2>
            <p className="text-emerald-100 font-semibold max-w-md mx-auto">
              Everything is unlocked for <strong>{profile.name}</strong>: unlimited Mama Titi, the full notebook, Exam Prep and My Week.
            </p>
            <button
              onClick={() => {
                setSuccessPlan(null);
                onClose();
              }}
              className={`${FUN} ${PRESS} px-8 py-4 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-xl font-bold border-b-[6px] border-[#E0A800]`}
            >
              Start learning ▶
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-br from-[#16A34A] via-[#0E8256] to-[#064E3B] text-white px-5 pt-7 pb-10 text-center space-y-3">
              <Emoji3D emoji="🚀" className="w-24 h-24 mx-auto animate-bounce" />
              <h2 className={`${FUN} text-3xl sm:text-4xl font-bold leading-tight`}>
                {stage === 'paid' ? `${profile.name} has full access` : `Unlock everything for ${profile.name}`}
              </h2>
              <p className="text-emerald-100 font-semibold max-w-md mx-auto">
                Unlimited Mama Titi, the full notebook, Exam Prep and weekly revision.
              </p>

              {stage !== 'paid' && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2.5 text-left">
                  <Emoji3D emoji={stage === 'trial' ? '🎁' : '⏳'} className="w-10 h-10" />
                  <div>
                    <p className={`${FUN} font-bold text-[#FFC83D]`}>
                      {stage === 'trial'
                        ? `Free trial: ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'} left`
                        : 'Your 7-day free trial has ended'}
                    </p>
                    <p className="text-sm text-emerald-100 font-semibold">
                      Today: {chatsUsed} of {chatLimit} free Mama Titi chats used
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-1">
                <div className="inline-flex bg-black/25 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setBillingInterval('monthly')}
                    className={`${FUN} ${PRESS} px-5 py-2.5 rounded-xl font-bold ${!yearly ? 'bg-[#FFC83D] text-[#064E3B]' : 'text-white'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval('yearly')}
                    className={`${FUN} ${PRESS} px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 ${yearly ? 'bg-[#FFC83D] text-[#064E3B]' : 'text-white'}`}
                  >
                    Yearly <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6B35] text-white">Save 40%</span>
                  </button>
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-sm font-semibold text-center">
                {paymentError}
              </div>
            )}

            {/* Plans: Basic first on phones */}
            <div className="bg-[#FFF8EC] p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 -mt-4 rounded-t-[28px] relative">

              <div className="md:order-2 relative rounded-[28px] bg-white border-4 border-[#FFC83D] border-b-[8px] p-5 space-y-4 shadow-xl">
                <span className={`${FUN} absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF6B35] text-white text-sm font-bold whitespace-nowrap`}>
                  ⭐ Most popular
                </span>
                <div className="flex items-center gap-3">
                  <Emoji3D emoji="👑" className="w-16 h-16" />
                  <div>
                    <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>Basic</p>
                    <p className="text-sm font-bold text-slate-500">For 1 child</p>
                  </div>
                </div>
                <div>
                  <p className={`${FUN} text-4xl font-bold text-slate-900`}>
                    {yearly ? '₦3,600' : '₦6,000'}
                    <span className="text-base text-slate-500 font-semibold"> / month</span>
                  </p>
                  <p className="text-sm font-bold text-[#16A34A]">{yearly ? '₦43,200 a year (save 40%)' : 'Pay monthly'}</p>
                </div>
                <ul className="space-y-2.5 text-[15px] font-semibold text-slate-700">
                  <Feature emoji="💬">Unlimited Mama Titi chats &amp; homework snaps</Feature>
                  <Feature emoji="📒">Full notebook: view, print &amp; download</Feature>
                  <Feature emoji="🎓">Unlimited Exam Prep (Common Entrance, BECE, WAEC)</Feature>
                  <Feature emoji="🗓️">My Week revision &amp; Weekly Challenge</Feature>
                  <Feature emoji="📈">Parent reports</Feature>
                  <Feature emoji="📚">All subjects, Primary 3 to SS3</Feature>
                </ul>
                {currentPlan === 'basic' && stage === 'paid' ? (
                  <div className={`${FUN} w-full py-4 rounded-2xl bg-slate-100 text-slate-500 text-xl font-bold text-center`}>Current plan</div>
                ) : (
                  <button
                    onClick={() => handleSubscribe('basic')}
                    disabled={isLoadingPlan !== null}
                    className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#16A34A] text-white text-xl font-bold border-b-[6px] border-[#064E3B] disabled:opacity-60 inline-flex items-center justify-center gap-2`}
                  >
                    {isLoadingPlan === 'basic' ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening checkout...</> : 'Get Basic ▶'}
                  </button>
                )}
              </div>

              <div className="md:order-3 rounded-[28px] bg-gradient-to-br from-[#7E22CE] to-[#4C1D95] text-white border-b-[8px] border-[#2E1065] p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <Emoji3D emoji="👨‍👩‍👧‍👦" className="w-16 h-16" />
                  <div>
                    <p className={`${FUN} text-2xl font-bold`}>Family</p>
                    <p className="text-sm font-bold text-purple-200">Up to 3 children</p>
                  </div>
                </div>
                <div>
                  <p className={`${FUN} text-4xl font-bold`}>
                    {yearly ? '₦7,200' : '₦12,000'}
                    <span className="text-base text-purple-200 font-semibold"> / month</span>
                  </p>
                  <p className="text-sm font-bold text-[#FFC83D]">{yearly ? '₦86,400 a year (save 40%)' : 'Pay monthly'}</p>
                </div>
                <ul className="space-y-2.5 text-[15px] font-semibold">
                  <Feature emoji="✅">Everything in Basic</Feature>
                  <Feature emoji="👥">Up to 3 children</Feature>
                  <Feature emoji="📱">Priority WhatsApp support</Feature>
                  <Feature emoji="✨">Early access to new features</Feature>
                  <Feature emoji="🌍">Igbo and Hausa (coming soon)</Feature>
                </ul>
                {currentPlan === 'family' && stage === 'paid' ? (
                  <div className={`${FUN} w-full py-4 rounded-2xl bg-white/15 text-white text-xl font-bold text-center`}>Current plan</div>
                ) : (
                  <button
                    onClick={() => handleSubscribe('family')}
                    disabled={isLoadingPlan !== null}
                    className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#FFC83D] text-[#2E1065] text-xl font-bold border-b-[6px] border-[#E0A800] disabled:opacity-60 inline-flex items-center justify-center gap-2`}
                  >
                    {isLoadingPlan === 'family' ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening checkout...</> : 'Get Family ▶'}
                  </button>
                )}
              </div>

              <div className="md:order-1 rounded-[28px] bg-white border-2 border-slate-200 border-b-[6px] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Emoji3D emoji="🎮" className="w-16 h-16" />
                  <div>
                    <p className={`${FUN} text-2xl font-bold text-slate-800`}>Free</p>
                    <p className="text-sm font-bold text-slate-500">{stage === 'paid' ? 'Always free' : "You're on this plan"}</p>
                  </div>
                </div>
                <p className={`${FUN} text-4xl font-bold text-slate-900`}>₦0</p>
                <ul className="space-y-2.5 text-[15px] font-semibold text-slate-700">
                  <Feature emoji="🎁">7-day trial: 5 chats, 5 notebook &amp; 5 Exam Prep a day</Feature>
                  <Feature emoji="💬">Then 2 Mama Titi chats a day</Feature>
                  <Feature emoji="🎮">Game Zone: all games free</Feature>
                  <Feature emoji="🏆">Leaderboard, stars &amp; coins</Feature>
                </ul>
                {stage !== 'paid' && (
                  <div className={`${FUN} w-full py-3.5 rounded-2xl bg-slate-100 text-slate-500 text-lg font-bold text-center`}>Current plan</div>
                )}
              </div>
            </div>

            {/* Trust row */}
            <div className="bg-[#FFF8EC] px-4 pb-6 sm:px-6">
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-bold text-slate-600">
                <p className="flex items-center gap-2"><Emoji3D emoji="🔒" className="w-8 h-8" /> Secure payment with Paystack</p>
                <p className="flex items-center gap-2"><Emoji3D emoji="💳" className="w-8 h-8" /> Card, bank transfer or USSD</p>
                <button onClick={handleWhatsAppSupport} className="flex items-center gap-2 text-[#15803D] text-left">
                  <Emoji3D emoji="💬" className="w-8 h-8" /> Questions? Chat with us on WhatsApp
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 rounded-2xl text-slate-600 font-bold underline"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
