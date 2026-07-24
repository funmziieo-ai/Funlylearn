import { createClient, User, Session } from '@supabase/supabase-js';
import { UserProfile, ChatMessage, UserSubscription, SubscriptionPlan } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Guest Session Key
const GUEST_SESSION_KEY = 'funlylearn_guest_session_id';
const LOCAL_SUB_KEY = 'funlylearn_user_subscription_v1';
const GUEST_DAILY_MSG_KEY = 'funlylearn_guest_daily_msgs_v1';

export function getOrCreateGuestSessionId(): string {
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

// Track guest daily message count
export function getGuestDailyMessageCount(): { count: number; date: string } {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(GUEST_DAILY_MSG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        return parsed;
      }
    }
    return { count: 0, date: today };
  } catch (e) {
    return { count: 0, date: new Date().toISOString().split('T')[0] };
  }
}

export function incrementGuestDailyMessageCount(): number {
  const current = getGuestDailyMessageCount();
  const newCount = current.count + 1;
  localStorage.setItem(GUEST_DAILY_MSG_KEY, JSON.stringify({
    count: newCount,
    date: current.date
  }));
  return newCount;
}

// Subscription Local Cache Helper
export function getStoredSubscription(): UserSubscription {
  try {
    const saved = localStorage.getItem(LOCAL_SUB_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading stored subscription:', e);
  }
  // Default free trial (7 days)
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    plan: 'free',
    status: 'trial',
    startedAt: now.toISOString(),
    expiresAt: trialEnd.toISOString(),
    currency: 'NGN'
  };
}

export function saveStoredSubscription(sub: UserSubscription): void {
  try {
    localStorage.setItem(LOCAL_SUB_KEY, JSON.stringify(sub));
  } catch (e) {
    console.warn('Error saving local subscription:', e);
  }
}

// AUTH FUNCTIONS
export async function signUpWithEmail(email: string, pass: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) {
    // Demo mock auth fallback when Supabase keys are not set
    const mockUser: any = { id: `usr_${Date.now()}`, email };
    return { user: mockUser, session: null, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) {
      if (error.message.includes('already registered')) {
        return { user: null, session: null, error: 'Account already exists. Please sign in instead!' };
      }
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (e: any) {
    return { user: null, session: null, error: e.message || 'Connection failed. Please check your internet.' };
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) {
    const mockUser: any = { id: `usr_${Date.now()}`, email };
    return { user: mockUser, session: null, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, session: null, error: 'Incorrect password. Please try again or reset.' };
      }
      if (error.message.includes('User not found')) {
        return { user: null, session: null, error: 'No account found. Please sign up first.' };
      }
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (e: any) {
    return { user: null, session: null, error: e.message || 'Connection failed. Please check your internet.' };
  }
}

export async function signInWithGoogleOAuth(): Promise<{ user?: any; error: string | null }> {
  if (!supabase) {
    const mockUser: any = { id: `google_usr_${Date.now()}`, email: 'scholar@funlylearn.ng' };
    return { user: mockUser, error: null };
  }
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      if (
        error.message?.includes('provider is not enabled') ||
        error.message?.includes('Unsupported provider') ||
        (error as any).status === 400 ||
        (error as any).code === 'validation_failed'
      ) {
        return {
          error: 'Google Sign-In is not enabled on this Supabase instance yet. Please sign in with Email & Password below or Continue as Guest!'
        };
      }
      return { error: error.message };
    }
    return { error: null };
  } catch (e: any) {
    if (
      e?.message?.includes('provider is not enabled') ||
      e?.message?.includes('Unsupported provider')
    ) {
      return {
        error: 'Google Sign-In is not enabled on this Supabase instance yet. Please sign in with Email & Password below or Continue as Guest!'
      };
    }
    return { error: e.message || 'OAuth initialization failed' };
  }
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: true, message: 'Password reset email sent (Demo Mode).' };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password reset link sent to your email! Check your inbox, ọmọ mi.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Reset failed. Check internet connection.' };
  }
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_SUB_KEY);
}

// FETCH CHILD PROFILE FOR LOGGED IN USER OR GUEST
export async function fetchChildProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id || userId,
      name: data.name || 'Scholar',
      classLevel: data.class_level || 'JSS 1',
      language: data.language || 'en',
      isOutOfSchool: data.is_out_of_school || false,
      stars: data.stars || 0,
      streakDays: data.streak_days || 1,
      level: data.level || 1,
      parentApprovedCount: data.parent_approved_count || 0,
      unlockedRewards: data.unlocked_rewards || ['r1'],
      parentWhatsApp: data.parent_whatsapp || '',
      createdAt: data.created_at || new Date().toISOString()
    };
  } catch (e) {
    console.warn('Error fetching profile from Supabase:', e);
    return null;
  }
}

// SAVE CHILD PROFILE TO SUPABASE WITH user_id / session_id
export async function saveChildProfileToSupabase(profile: UserProfile, userId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('child_profiles').upsert({
      id: profile.id,
      user_id: userId,
      name: profile.name,
      class_level: profile.classLevel,
      language: profile.language,
      is_out_of_school: profile.isOutOfSchool,
      stars: profile.stars,
      streak_days: profile.streakDays,
      level: profile.level,
      parent_approved_count: profile.parentApprovedCount,
      unlocked_rewards: profile.unlockedRewards,
      parent_whatsapp: profile.parentWhatsApp,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('Error upserting child profile to Supabase:', e);
  }
}

// SAVE SUBSCRIPTION TO SUPABASE TABLE 'subscriptions'
export async function saveSubscriptionToSupabase(sub: UserSubscription, userId: string): Promise<void> {
  saveStoredSubscription(sub);
  if (!supabase) return;
  try {
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: sub.plan,
      status: sub.status,
      paystack_reference: sub.paystackReference || null,
      amount: sub.amount || 0,
      currency: sub.currency || 'NGN',
      started_at: sub.startedAt,
      expires_at: sub.expiresAt || null
    });
  } catch (e) {
    console.warn('Error saving subscription to Supabase:', e);
  }
}

// FETCH USER SUBSCRIPTION FROM SUPABASE
export async function fetchSubscriptionFromSupabase(userId: string): Promise<UserSubscription | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const sub: UserSubscription = {
      id: data.id,
      userId: data.user_id,
      plan: data.plan as SubscriptionPlan,
      status: data.status,
      paystackReference: data.paystack_reference,
      amount: data.amount,
      currency: data.currency,
      startedAt: data.started_at,
      expiresAt: data.expires_at
    };
    saveStoredSubscription(sub);
    return sub;
  } catch (e) {
    return null;
  }
}
