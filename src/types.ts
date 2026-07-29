export type ClassLevel =
  | 'Primary 3'
  | 'Primary 4'
  | 'Primary 5'
  | 'Primary 6'
  | 'JSS 1'
  | 'JSS 2'
  | 'JSS 3'
  | 'SS 1'
  | 'SS 2'
  | 'SS 3';

export type LanguageCode = 'en' | 'yo' | 'ig' | 'ha';

export interface UserProfile {
  id: string;
  name: string;
  classLevel: ClassLevel;
  language: LanguageCode;
  isOutOfSchool: boolean;
  stars: number;
  streakDays: number;
  level: number;
  parentApprovedCount: number;
  unlockedRewards: string[];
  parentWhatsApp?: string;
  createdAt: string;
  coins?: number;
  lingoLevel?: number;
  correctStreak?: number;
  totalCorrect?: number;
  homeworksSnapped?: number;
}

export interface CurriculumTopic {
  id: string;
  classLevel: ClassLevel;
  subject: string;
  topicName: string;
  nerdcUnit: string;
  description: string;
  keyConcepts: string[];
  sampleQuestion: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mama_titi';
  text: string;
  timestamp: string;
  audioUrl?: string;
  imagePath?: string;
  topicRef?: string;
  isStepByStep?: boolean;
}

export interface LingoWord {
  id: string;
  word: string;
  language: 'Yoruba' | 'Hausa' | 'Igbo';
  phonetic: string;
  englishTranslation: string;
  category: 'Greetings' | 'Family' | 'Numbers' | 'School' | 'Food' | 'Wisdom';
  culturalNote: string;
  sampleSentence: string;
  sentenceTranslation: string;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  stars: number;
  classLevel: ClassLevel;
  avatarUrl?: string;
  isUser?: boolean;
  levelBadge: string;
}

export interface SmartNote {
  id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  date: string;
  summary: string;
  keyTakeaways: string[];
  nerdcRef: string;
}

export interface ParentReward {
  id: string;
  title: string;
  description: string;
  requiredStars: number;
  requiredHomeworks: number;
  isUnlocked: boolean;
  icon: string;
}

export type SubscriptionPlan = 'free' | 'basic' | 'family';

export interface UserSubscription {
  id?: string;
  userId?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'canceled';
  paystackReference?: string;
  amount?: number;
  currency?: 'NGN' | 'GBP' | 'USD';
  startedAt: string;
  expiresAt?: string;
  billingInterval?: 'monthly' | 'yearly';
}

export interface AuthState {
  user: any | null;
  isGuest: boolean;
  guestSessionId: string;
  isLoading: boolean;
}

export interface LingoLevel {
  id: number;
  name: string;
  description: string;
  coinsRequired: number;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  timestamp: string;
}
