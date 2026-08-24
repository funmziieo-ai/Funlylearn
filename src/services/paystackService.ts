import PaystackPop from '@paystack/inline-js';

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

export function openPaystackCheckout(params: PaystackCheckoutParams) {
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  if (!paystackKey) {
    console.error('VITE_PAYSTACK_PUBLIC_KEY is not set — cannot open checkout.');
    if (params.onError) params.onError();
    return;
  }

  const ref = `funlylearn_${Date.now()}`;
  const paystack = new PaystackPop();

  try {
    paystack.newTransaction({
      key: paystackKey,
      email: params.email,
      amount: params.amount,
      currency: params.currency || 'NGN',
      ref,
      metadata: {
        user_id: params.userId,
        plan: params.plan,
        child_name: params.childName,
        class_level: params.classLevel
      },
      onSuccess: (transaction: any) => {
        // IMPORTANT: this callback firing is NOT proof a payment
        // genuinely, verifiably succeeded — it only means the popup
        // itself reported success. The real, trustworthy confirmation
        // comes from the server-side webhook, which is what actually
        // updates the subscription in the database. Treat this as
        // "show an optimistic processing state" only, never as the
        // final word on whether the family should get real access.
        const reference = transaction.reference || transaction.trxref || ref;
        params.onSuccess(reference);
      },
      onCancel: () => {
        if (params.onCancel) params.onCancel();
      }
    });
  } catch (error) {
    // Real failure — tell the caller honestly, never fake a success.
    // A blocked popup or network error means the family has NOT paid,
    // and must never be silently granted access as if they had.
    console.error('Paystack checkout failed to open:', error);
    if (params.onError) params.onError();
  }
}
