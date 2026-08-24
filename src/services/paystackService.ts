import PaystackPop from '@paystack/inline-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export interface PaystackCheckoutParams {
  email: string;
  amount: number; // in smallest unit (kobo for NGN)
  plan: 'basic' | 'family';
  userId: string;
  childName: string;
  classLevel: string;
  currency?: 'NGN' | 'GBP';
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
  onError?: () => void;
}

export async function openPaystackCheckout(params: PaystackCheckoutParams) {
  const ref = `funlylearn_${Date.now()}`;
  const metadata = {
    user_id: params.userId,
    plan: params.plan,
    child_name: params.childName,
    class_level: params.classLevel
  };

  // Native apps (the installed APK) can't reliably use Paystack's
  // popup-based checkout — Android's WebView doesn't support the
  // popup window behavior it relies on, causing it to silently do
  // nothing when tapped. Opening the real, hosted Paystack checkout
  // page in the device's actual system browser instead sidesteps this
  // entirely, since it's no longer running inside the app's restricted
  // WebView at all.
  if (Capacitor.isNativePlatform()) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/paystack-initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          amount: params.amount,
          currency: params.currency || 'NGN',
          reference: ref,
          metadata
        })
      });

      const data = await res.json();
      if (!res.ok || !data.authorizationUrl) {
        console.error('Failed to initialize Paystack transaction:', data);
        if (params.onError) params.onError();
        return;
      }

      await Browser.open({ url: data.authorizationUrl });

      // IMPORTANT: opening a real external browser means we lose the
      // direct onSuccess callback Paystack's inline popup would have
      // given us — there's no way to know from here whether the family
      // actually completed payment in that separate browser window.
      // This is fine and expected: the real, trustworthy confirmation
      // still comes from the webhook, the same as the web flow. The
      // caller (PricingModal.tsx) needs to independently start
      // checking for that confirmed subscription once this browser
      // opens, rather than waiting on a callback that will never fire
      // this way.
      params.onSuccess(ref);
      return;
    } catch (error) {
      console.error('Native checkout failed to open:', error);
      if (params.onError) params.onError();
      return;
    }
  }

  // Web (Vercel) — Paystack's inline popup works correctly here,
  // confirmed in real testing, so it stays unchanged.
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  if (!paystackKey) {
    console.error('VITE_PAYSTACK_PUBLIC_KEY is not set — cannot open checkout.');
    if (params.onError) params.onError();
    return;
  }

  const paystack = new PaystackPop();

  try {
    paystack.newTransaction({
      key: paystackKey,
      email: params.email,
      amount: params.amount,
      currency: params.currency || 'NGN',
      ref,
      metadata,
      onSuccess: (transaction: any) => {
        const reference = transaction.reference || transaction.trxref || ref;
        params.onSuccess(reference);
      },
      onCancel: () => {
        if (params.onCancel) params.onCancel();
      }
    });
  } catch (error) {
    console.error('Paystack checkout failed to open:', error);
    if (params.onError) params.onError();
  }
}
