import { UserProfile, ChatMessage, CurriculumTopic, LingoWord, LeaderboardUser, ParentReward } from '../types';
import { supabase } from './supabaseService';

export { supabase };

// Local storage key defaults
const PROFILE_KEY = 'funlylearn_user_profile_v2';
const CHAT_KEY = 'funlylearn_chat_history_v2';

export const DEFAULT_USER: UserProfile = {
  id: 'user-tobi-1',
  name: 'Tobi',
  classLevel: 'JSS 1',
  language: 'en',
  isOutOfSchool: false,
  stars: 942,
  streakDays: 4,
  level: 12,
  parentApprovedCount: 3,
  unlockedRewards: ['r1'],
  parentWhatsApp: '2348012345678',
  createdAt: new Date().toISOString()
};

export function getStoredProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading local profile:', e);
  }
  return DEFAULT_USER;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving local profile:', e);
  }
}

export function getStoredChat(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(CHAT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading local chat:', e);
  }
  return [
    {
      id: 'm1',
      sender: 'mama_titi',
      text: 'E kaaro! 🌟 I am Mama Titi! Tell me what you are studying today and I will explain through a fun Nigerian story! What homework topic are we solving together?',
      timestamp: 'Just now'
    }
  ];
}

export function saveStoredChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Error saving local chat:', e);
  }
}

export async function sendMessageToMamaTiti(params: {
  message: string;
  profile: UserProfile;
  imageBase64?: string;
  conversationHistory?: ChatMessage[];
}): Promise<{ reply: string; timestamp: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        childName: params.profile.name,
        classLevel: params.profile.classLevel,
        language: params.profile.language,
        isOutOfSchool: params.profile.isOutOfSchool,
        imageBase64: params.imageBase64,
        conversationHistory: params.conversationHistory
      })
    });
    if (!res.ok) throw new Error('Chat network error');
    return await res.json();
  } catch (err) {
    console.warn('Mama Titi server call failed, providing offline guided response:', err);
    return {
      reply: `Ah, my scholar ${params.profile.name}! Excellent question on ${params.profile.classLevel} homework! Let's think of it like dividing a basket of oranges at the local market: if we break it into smaller steps, what do we start with first?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

export interface VoiceConfigResponse {
  yarnGptConfigured: boolean;
  hasYarnGptKey: boolean;
  yarnGptKeyMasked: string;
}

export async function fetchAudioTTS(text: string, language: string): Promise<{ audioBase64?: string; useClientSpeech?: boolean; textToSpeak?: string; voice?: string }> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    if (!res.ok) throw new Error('TTS network error');
    return await res.json();
  } catch (err) {
    return { useClientSpeech: true, textToSpeak: text };
  }
}

export async function getVoiceConfig(): Promise<VoiceConfigResponse> {
  try {
    const res = await fetch('/api/config/voice');
    if (!res.ok) throw new Error('Config network error');
    return await res.json();
  } catch (err) {
    return {
      yarnGptConfigured: false,
      hasYarnGptKey: false,
      yarnGptKeyMasked: ''
    };
  }
}

export async function saveVoiceConfig(params: {
  yarnApiKey?: string;
}): Promise<{ success: boolean; config: VoiceConfigResponse; message: string }> {
  try {
    const res = await fetch('/api/config/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Save config error');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      config: {
        yarnGptConfigured: false,
        hasYarnGptKey: false,
        yarnGptKeyMasked: ''
      },
      message: 'Failed to connect to server.'
    };
  }
}

// Backwards compatibility helper
export const saveYarnGptKey = async (yarnApiKey: string) => saveVoiceConfig({ yarnApiKey });

