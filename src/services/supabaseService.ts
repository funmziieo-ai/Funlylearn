import { createClient, User, Session } from '@supabase/supabase-js';
import { UserProfile, ChatMessage, UserSubscription, SubscriptionPlan } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Guest Session Key
const GUEST_SESSION_KEY = 'funlylearn_guest_session_id';
const LOCAL_SUB_KEY = 'funlylearn_user_subscription_v1';

export function getOrCreateGuestSessionId(): string {
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

// DAILY LIMIT COMPLETELY REMOVED
// All users can send unlimited messages
// Guest daily message functions removed
// isLimitReached always returns false
export function getGuestDailyMessageCount(): { count: number; date: string } {
  return { count: 0, date: new Date().toISOString().split('T')[0] };
}

export function incrementGuestDailyMessageCount(): number {
  return 0;
}

export function isGuestLimitReached(): boolean {
  return false;
}

// Subscription Local Cache Helper
export function getStoredSubscription(): UserSubscription {
  try {
    const saved = localStorage.getItem(LOCAL_SUB_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading stored subscription:', e);
  }
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
export async function signUpWithEmail(
  email: string,
  pass: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) {
    const mockUser: any = { id: `usr_${Date.now()}`, email };
    return { user: mockUser, session: null, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return {
          user: null,
          session: null,
          error: 'Account already exists. Please sign in instead!'
        };
      }
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (e: any) {
    return {
      user: null,
      session: null,
      error: e.message || 'Connection failed. Please check your internet.'
    };
  }
}

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) {
    const mockUser: any = { id: `usr_${Date.now()}`, email };
    return { user: mockUser, session: null, error: null };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return {
          user: null,
          session: null,
          error: 'Incorrect password. Please try again or reset.'
        };
      }
      if (error.message.includes('User not found')) {
        return {
          user: null,
          session: null,
          error: 'No account found. Please sign up first.'
        };
      }
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (e: any) {
    return {
      user: null,
      session: null,
      error: e.message || 'Connection failed. Please check your internet.'
    };
  }
}

export async function signInWithGoogleOAuth(): Promise<{
  user?: any;
  error: string | null;
}> {
  if (!supabase) {
    const mockUser: any = {
      id: `google_usr_${Date.now()}`,
      email: 'scholar@funlylearn.ng'
    };
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
          error:
            'Google Sign-In is not enabled yet. Please sign in with Email and Password or Continue as Guest!'
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
        error:
          'Google Sign-In is not enabled yet. Please sign in with Email and Password or Continue as Guest!'
      };
    }
    return { error: e.message || 'OAuth initialization failed' };
  }
}

export async function resetPasswordForEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: true, message: 'Password reset email sent (Demo Mode).' };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) return { success: false, message: error.message };
    return {
      success: true,
      message: 'Password reset link sent! Check your inbox.'
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Reset failed. Check internet connection.'
    };
  }
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_SUB_KEY);
}

// FETCH CHILD PROFILE
export async function fetchChildProfile(
  userId: string
): Promise<UserProfile | null> {
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
    console.warn('Error fetching profile:', e);
    return null;
  }
}

// SAVE CHILD PROFILE
export async function saveChildProfileToSupabase(
  profile: UserProfile,
  userId: string
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('child_profiles')
      .upsert(
        {
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
        },
        { onConflict: 'user_id' }
      );
  } catch (e) {
    console.warn('Error saving profile:', e);
  }
}

// SAVE SUBSCRIPTION
export async function saveSubscriptionToSupabase(
  sub: UserSubscription,
  userId: string
): Promise<void> {
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
    console.warn('Error saving subscription:', e);
  }
}

// FETCH SUBSCRIPTION
export async function fetchSubscriptionFromSupabase(
  userId: string
): Promise<UserSubscription | null> {
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

// HOMEWORK RECORDS — real log of what Mama Titi actually helped with,
// replacing the previous hardcoded "Send a ping" cards.
export interface HomeworkRecord {
  id: number;
  subject: string | null;
  topic: string;
  wasCorrect: boolean | null;
  createdAt: string;
}

export async function saveHomeworkRecord(
  userId: string,
  topic: string,
  wasCorrect: boolean | null,
  subject?: string
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('homework_records').insert({
      user_id: userId,
      subject: subject || null,
      topic,
      was_correct: wasCorrect
    });
  } catch (e) {
    console.warn('Error saving homework record:', e);
  }
}

export async function fetchHomeworkRecords(
  userId: string,
  limit: number = 5
): Promise<HomeworkRecord[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('homework_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      wasCorrect: r.was_correct,
      createdAt: r.created_at
    }));
  } catch (e) {
    return [];
  }
}

// EXAM REVISION QUESTIONS — fetched live from Supabase instead of a
// bundled static file, so updating/verifying more curriculum content
// never requires an APK rebuild.
export interface ExamQuestionRow {
  id: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  topicId: string;
  topicName: string;
  nerdcUnit: string;
  objectives: string[];
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export async function fetchExamRevisionQuestions(
  examId: string
): Promise<ExamQuestionRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('exam_revision_questions')
      .select('*')
      .eq('exam_id', examId);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      examId: r.exam_id,
      subjectId: r.subject_id,
      subjectName: r.subject_name,
      subjectIcon: r.subject_icon,
      topicId: r.topic_id,
      topicName: r.topic_name,
      nerdcUnit: r.nerdc_unit,
      objectives: r.objectives,
      question: r.question,
      options: r.options,
      correctOptionIndex: r.correct_option_index,
      explanation: r.explanation
    }));
  } catch (e) {
    return [];
  }
}

// MESSAGE FEEDBACK — lightweight thumbs up/down on individual Mama Titi
// replies, a much lower-friction alternative to a standalone feedback
// form for everyday users.
export async function saveAppPollResponse(
  userId: string,
  question: string,
  answer: string
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('app_poll_responses').insert({
      user_id: userId,
      question,
      answer
    });
  } catch (e) {
    console.warn('Error saving poll response:', e);
  }
}

// LEADERBOARD — real users ranked by stars, scoped to the same class
// level so a Primary 3 child isn't compared against an SS3 student.
export async function fetchLeaderboard(
  classLevel: string,
  limit: number = 20
): Promise<{ id: string; name: string; stars: number; classLevel: string; level: number }[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('user_id, name, stars, class_level, level')
      .eq('class_level', classLevel)
      .order('stars', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.user_id,
      name: r.name || 'Scholar',
      stars: r.stars || 0,
      classLevel: r.class_level,
      level: r.level || 1
    }));
  } catch (e) {
    return [];
  }
}
