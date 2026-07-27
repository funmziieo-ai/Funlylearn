import { UserProfile, ChatMessage } from '../types';
import { supabase } from './supabaseService';
export { supabase };

const SUPABASE_FUNCTIONS_URL = 'https://qeooehgozaaojaovukfq.supabase.co/functions/v1';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_g-ZfK5SItIlOPNCQK5eltQ_llq2qy54';

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
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local chat:', e);
  }
  return [getWelcomeMessage()];
}

export function saveStoredChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Error saving local chat:', e);
  }
}

export function clearStoredChat(): void {
  try {
    localStorage.removeItem(CHAT_KEY);
  } catch (e) {
    console.warn('Error clearing local chat:', e);
  }
}

export function getWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome-' + Date.now(),
    sender: 'mama_titi',
    text: 'Welcome! I am Mama Titi, your Nigerian AI teacher. I teach the official Nigerian NERDC curriculum from Primary 3 to SS3 covering Mathematics, English, Sciences, Social Studies and exam preparation for Common Entrance, BECE, WAEC and JAMB. What class are you in and what would you like to study today?',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

async function sendWithRetry(
  params: {
    message: string;
    profile: UserProfile;
    imageBase64?: string;
    conversationHistory?: ChatMessage[];
  },
  retries = 2
): Promise<{ reply: string; timestamp: string }> {
  try {
    const res = await fetch(
      SUPABASE_FUNCTIONS_URL + '/mama-titi-chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          message: params.message,
          childName: params.profile.name,
          classLevel: params.profile.classLevel,
          language: params.profile.language,
          isOutOfSchool: params.profile.isOutOfSchool,
          imageBase64: params.imageBase64,
          conversationHistory: params.conversationHistory
        })
      }
    );

    if (res.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return sendWithRetry(params, retries - 1);
    }

    if (!res.ok) {
      throw new Error('Chat network error: ' + res.status);
    }

    return await res.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendWithRetry(params, retries - 1);
    }
    throw err;
  }
}

export async function sendMessageToMamaTiti(params: {
  message: string;
  profile: UserProfile;
  imageBase64?: string;
  conversationHistory?: ChatMessage[];
}): Promise<{ reply: string; timestamp: string }> {
  try {
    return await sendWithRetry(params);
  } catch (err) {
    console.warn('Mama Titi server call failed:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const is429 = errorMsg.includes('429');
    return {
      reply: is429
        ? 'Mama Titi is very busy right now! Please wait a moment and try again.'
        : 'Connection problem. Please check your internet and try again!',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }
}

export async function fetchAudioTTS(
  text: string,
  language: string
): Promise<{
  audioBase64?: string;
  useClientSpeech?: boolean;
  textToSpeak?: string;
  voice?: string;
}> {
  try {
    if (!text || text.trim().length === 0) {
      return { useClientSpeech: true, textToSpeak: text };
    }

    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/[✅❌⭐🌟📚🎮🇳🇬🇬🇧👍💪🔊📝🎯🏆🎉]/gu, '')
      .trim();

    const res = await fetch(
      SUPABASE_FUNCTIONS_URL + '/yarngpt-proxy',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          text: cleanText,
          voice: 'Idera',
          response_format: 'mp3'
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('YarnGPT error:', res.status, errText);
      throw new Error('TTS network error: ' + res.status);
    }

    const blob = await res.blob();

    if (blob.size < 100) {
      throw new Error('Audio blob too small');
    }

    const audioBase64 = await new Promise<string>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }
    );

    return { audioBase64, voice: 'Idera' };
  } catch (err) {
    console.error('YarnGPT call failed:', err);
    return { useClientSpeech: true, textToSpeak: text };
  }
}
