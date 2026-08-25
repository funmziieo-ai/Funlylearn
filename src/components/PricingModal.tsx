import React, { useState } from 'react';
import { Check, X, Sparkles, MessageCircle, ShieldCheck, Zap, Star, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, UserSubscription, SubscriptionPlan } from '../types';
import { openPaystackCheckout } from '../services/paystackService';
import { checkSubscriptionStatus } from '../services/supabaseService';

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
  const [currency, setCurrency] = useState<'NGN' | 'GBP' | 'USD'>('NGN');
  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [successPlan, setSuccessPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  if (!isOpen) return null;

  const currencySymbol = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : '$';

  const handleSubscribe = async (plan: 'basic' | 'family') => {
    setIsLoadingPlan(plan);
    setPaymentError(null);

    let amount: number;
    if (currency === 'NGN') {
      if (plan === 'basic') {
        amount = billingInterval === 'monthly' ? 600000 : 4320000;
      } else {
        amount = billingInterval === 'monthly' ? 1200000 : 8640000;
      }
    } else if (currency === 'GBP') {
      if (plan === 'basic') {
        amount = billingInterval === 'monthly' ? 1000 : 7200;
      } else {
        amount = billingInterval === 'monthly' ? 2000 : 14400;
      }
    } else {
      if (plan === 'basic') {
        amount = billingInterval === 'monthly' ? 1000 : 7200;
      } else {
        amount = billingInterval === 'monthly' ? 2000 : 14400;
      }
    }

    openPaystackCheckout({
      email: userEmail,
      amount,
      plan,
      userId,
      childName: profile.name,
      classLevel: profile.classLevel,
      currency,
      onSuccess: async (ref) => {
        // IMPORTANT: reaching here means the Paystack popup reported
        // success — it does NOT mean the family has real access yet.
        // The only thing that actually grants access is the real
        // subscription row created by the server-side webhook, once
        // Paystack independently confirms the payment. We wait for
        // that here instead of trusting the popup alone.
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

  // Polls for the real, webhook-created subscription row rather than
  // trusting the frontend popup alone. Checks every 2 seconds for up
  // to 20 seconds — webhooks are usually near-instant, but this gives
  // real room for normal network delay before giving up.
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
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        return;
      }
    }

    // Genuinely uncertain outcome after real waiting — tell the truth
    // rather than claim success or failure we can't actually confirm.
    // The payment may still be processing on Paystack's side; never
    // silently grant access here, and never falsely say it failed.
    setIsConfirmingPayment(false);
    setPendingConfirmation(true);
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      `Hi FunlyLearn! I need help choosing a subscription plan for my child in ${profile.classLevel}`
    );
    window.open(`https://wa.me/2347033267197?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
      
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border-2 border-amber-400/50 shadow-2xl overflow-hidden my-6 my-auto animate-fadeIn">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isConfirmingPayment ? (
          <div className="bg-[#064E3B] text-white p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-amber-300">
                Confirming your payment...
              </h2>
              <p className="text-sm text-emerald-100 font-sans">
                This usually only takes a few seconds. Please don't close this window.
              </p>
            </div>
          </div>
        ) : pendingConfirmation ? (
          <div className="bg-[#064E3B] text-white p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-amber-300">
                Still confirming...
              </h2>
              <p className="text-sm text-emerald-100 font-sans">
                Your payment may still be processing. If it went through, your access will unlock automatically within a few minutes — no need to pay again. If you're unsure, our team can check for you on WhatsApp.
              </p>
            </div>
            <button
              onClick={handleWhatsAppSupport}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-jakarta font-bold text-sm shadow-xl transition-all flex items-center space-x-2 mx-auto"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Check on WhatsApp</span>
            </button>
            <button
              onClick={() => {
                setPendingConfirmation(false);
                onClose();
              }}
              className="text-xs text-emerald-300 underline"
            >
              Close for now
            </button>
          </div>
        ) : successPlan ? (
          <div className="bg-[#064E3B] text-white p-8 sm:p-12 text-center space-y-6 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-10 h-10 text-slate-950 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 text-xs font-jakarta font-bold uppercase">
                Payment Successful
              </span>
              <h2 className="font-serif text-3xl font-bold text-amber-300">
                🎉 Welcome to FunlyLearn {successPlan.toUpperCase()} Plan!
              </h2>
              <p className="text-sm text-emerald-100 font-sans">
                Mama Titi is ready for <strong>{profile.name}</strong>! All homework features and unlimited questions are unlocked.
              </p>
            </div>

            <button
              onClick={() => {
                setSuccessPlan(null);
                onClose();
              }}
              className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jakarta font-bold text-sm shadow-xl transition-all flex items-center space-x-2 mx-auto"
            >
              <span>Start Learning Now 🌟</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-[#064E3B] text-white p-6 sm:p-8 text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 text-xs font-jakarta font-bold uppercase">
                Official Nigerian NERDC Companion
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">
                Upgrade FunlyLearn
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
                Choose the right plan for your child. Unlock unlimited homework explanations with Mama Titi!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                
                <div className="bg-[#022C22] p-1 rounded-2xl border border-amber-400/30 flex items-center text-xs font-jakarta font-bold">
                  <button
                    onClick={() => setBillingInterval('monthly')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      billingInterval === 'monthly'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval('yearly')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                      billingInterval === 'yearly'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="bg-[#FF6B35] text-white text-[9px] px-1.5 py-0.2 rounded-full">
                      Save 40%
                    </span>
                  </button>
                </div>

                <div className="bg-[#022C22] p-1 rounded-2xl border border-amber-400/30 flex items-center text-xs font-jakarta font-bold">
                  <button
                    onClick={() => setCurrency('NGN')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      currency === 'NGN'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    🇳🇬 ₦ Nigeria
                  </button>
                  <button
                    onClick={() => setCurrency('GBP')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      currency === 'GBP'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    🇬🇧 £ UK
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      currency === 'USD'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    🇺🇸 $ Diaspora
                  </button>
                </div>

              </div>
            </div>

            {paymentError && (
              <div className="mx-5 sm:mx-8 mt-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-medium text-center">
                {paymentError}
              </div>
            )}

            <div className="p-5 sm:p-8 bg-[#FFFDF5] grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-soft">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-800">Free</h3>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-serif">
                      {currencySymbol}0
                      <span className="text-xs text-slate-500 font-normal"> / month</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-700 font-sans">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>5 messages or homework snaps per day</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>5 notebook views per day</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>5 Exam Prep attempts per day</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited Mama Titi voice</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Naija Lingo — unlock levels by earning coins</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Public leaderboard</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <X className="w-4 h-4 shrink-0" />
                      <span className="line-through">Unlimited messages & snaps</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <X className="w-4 h-4 shrink-0" />
                      <span className="line-through">Unlimited notebook & Exam Prep</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <X className="w-4 h-4 shrink-0" />
                      <span className="line-through">Priority support</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-jakarta font-bold text-xs cursor-not-allowed"
                >
                  Current Plan
                </button>
              </div>

              <div className="bg-white rounded-3xl border-2 border-amber-400 p-5 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-jakarta font-bold text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                  Recommended
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#064E3B]">Basic</h3>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-serif flex items-baseline flex-wrap">
                      {currency === 'NGN' ? (
                        billingInterval === 'monthly' ? (
                          <>
                            <span>₦6,000</span>
                            <span className="text-xs text-slate-500 font-normal ml-1"> / month</span>
                          </>
                        ) : (
                          <>
                            <span>₦3,600</span>
                            <span className="text-xs text-slate-500 font-normal ml-1"> / mo, billed yearly</span>
                          </>
                        )
                      ) : (
                        billingInterval === 'monthly' ? (
                          <>
                            <span>{currencySymbol}10</span>
                            <span className="text-xs text-slate-500 font-normal ml-1"> / month</span>
                          </>
                        ) : (
                          <>
                            <span>{currencySymbol}6</span>
                            <span className="text-xs text-slate-500 font-normal ml-1"> / mo, billed yearly</span>
                          </>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      {currency === 'NGN'
                        ? (billingInterval === 'yearly' ? '₦43,200 / year (save 40%)' : 'Flexible monthly billing')
                        : (billingInterval === 'yearly' ? `${currencySymbol}72 / year (save 40%)` : 'Diaspora instant access')}
                    </p>
                  </div>

                  <div className="border-t border-amber-100 pt-3 space-y-2 text-xs text-slate-800 font-sans">
                    <div className="flex items-center space-x-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited messages & homework snaps</span>
                    </div>
                    <div className="flex items-center space-x-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited notebook & Exam Prep access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Smart notebook — view, print & download</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All subjects Primary 3 to SS3</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Leaderboard and star system</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Parent dashboard and reports</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Grandma conversation scripts</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <X className="w-4 h-4 shrink-0" />
                      <span className="line-through">Multiple children</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe('basic')}
                  disabled={isLoadingPlan !== null}
                  className="w-full py-3.5 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] disabled:opacity-60 text-white font-jakarta font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isLoadingPlan === 'basic' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening checkout...</span>
                    </>
                  ) : (
                    <span>Subscribe to Basic</span>
                  )}
                </button>
              </div>

              <div className="bg-[#022C22] text-white rounded-3xl border-2 border-emerald-400 p-5 space-y-4 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-amber-300">Family</h3>
                    <div className="text-2xl font-bold text-white mt-1 font-serif flex items-baseline flex-wrap">
                      {currency === 'NGN' ? (
                        billingInterval === 'monthly' ? (
                          <>
                            <span>₦12,000</span>
                            <span className="text-xs text-emerald-200 font-normal ml-1"> / month</span>
                          </>
                        ) : (
                          <>
                            <span>₦7,200</span>
                            <span className="text-xs text-emerald-200 font-normal ml-1"> / mo, billed yearly</span>
                          </>
                        )
                      ) : (
                        billingInterval === 'monthly' ? (
                          <>
                            <span>{currencySymbol}20</span>
                            <span className="text-xs text-emerald-200 font-normal ml-1"> / month</span>
                          </>
                        ) : (
                          <>
                            <span>{currencySymbol}12</span>
                            <span className="text-xs text-emerald-200 font-normal ml-1"> / mo, billed yearly</span>
                          </>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200 font-medium mt-1">
                      {currency === 'NGN'
                        ? (billingInterval === 'yearly' ? '₦86,400 / year (save 40%)' : 'Up to 3 children access')
                        : (billingInterval === 'yearly' ? `${currencySymbol}144 / year (save 40%)` : 'Diaspora family bundle')}
                    </p>
                  </div>

                  <div className="border-t border-emerald-800/80 pt-3 space-y-2 text-xs text-emerald-100 font-sans">
                    <div className="flex items-center space-x-2 font-bold text-amber-300">
                      <Check className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Everything in Basic</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Up to 3 children</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Friend and cousin battles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Priority WhatsApp support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Early access to new features</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Igbo and Hausa coming soon</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe('family')}
                  disabled={isLoadingPlan !== null}
                  className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-jakarta font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isLoadingPlan === 'family' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Opening checkout...</span>
                    </>
                  ) : (
                    <span>Subscribe to Family</span>
                  )}
                </button>
              </div>

            </div>

            <div className="p-4 bg-emerald-950 text-center border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 px-6">
              <span className="text-xs text-emerald-200 font-medium">
                Need help choosing a plan or making a bank transfer? Chat with our team!
              </span>
              <button
                onClick={handleWhatsAppSupport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-jakarta font-bold text-xs shadow-xs flex items-center space-x-2 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
