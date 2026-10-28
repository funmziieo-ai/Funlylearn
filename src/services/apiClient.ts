import { UserProfile, ChatMessage } from '../types';
import { supabase, getUsageUserKey, getAccessToken } from './supabaseService';
export { supabase };

const SUPABASE_FUNCTIONS_URL = 'https://qeooehgozaaojaovukfq.supabase.co/functions/v1';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_g-ZfK5SItIlOPNCQK5eltQ_llq2qy54';

const PROFILE_KEY = 'funlylearn_user_profile_v2';
const CHAT_KEY = 'funlylearn_chat_history_v2';

export const DEFAULT_USER: UserProfile = {
  id: 'guest-' + Date.now(),
  name: '',
  classLevel: 'JSS 1',
  language: 'en',
  isOutOfSchool: false,
  stars: 0,
  streakDays: 1,
  level: 1,
  parentApprovedCount: 0,
  unlockedRewards: ['r1'],
  parentWhatsApp: '',
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

export function getWelcomeMessage(language?: string): ChatMessage {
  const isYoruba = language === 'yo';
  return {
    id: 'welcome-' + Date.now(),
    sender: 'mama_titi',
    text: isYoruba
      ? 'Ẹ kaaro! Orukọ mi ni Mama Titi. Mo jẹ olukọ AI ara Naijiria rẹ ninu FunlyLearn. Mo n kọ ẹ̀kọ́ ilé-ìwé oṣiṣẹ́ ìjọba Nàìjíríà láti Primary 3 sí SS3 pẹ̀lú Mathematics, English, Science, Social Studies àti ìmúrasílẹ̀ fún Common Entrance, BECE àti WAEC. Kí ni kíláàsì rẹ àti kíni o fẹ́ kọ́ lónìí?'
      : 'Welcome! I am Mama Titi, your Nigerian AI teacher. I teach the official Nigerian school curriculum from Primary 3 to SS3 covering Mathematics, English, Sciences, Social Studies and exam preparation for Common Entrance, BECE and WAEC. What class are you in and what would you like to study today?',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

export function getStoredChat(language?: string): ChatMessage[] {
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
  return [getWelcomeMessage(language)];
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

async function sendWithRetry(
  params: {
    message: string;
    profile: UserProfile;
    imageBase64?: string;
    conversationHistory?: ChatMessage[];
  },
  retries = 2
): Promise<{ reply: string; timestamp: string; subject?: string | null; curriculumVerified?: boolean; detectedTopic?: string | null }> {
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
}): Promise<{ reply: string; timestamp: string; subject?: string | null; curriculumVerified?: boolean; detectedTopic?: string | null }> {
  try {
    return await sendWithRetry(params);
  } catch (err) {
    console.warn('Mama Titi server call failed:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const is429 = errorMsg.includes('429');
    const isYoruba = params.profile.language === 'yo';
    return {
      reply: is429
        ? isYoruba
          ? 'Mama Titi ti n ṣiṣẹ pupọ lọwọlọwọ! Jọwọ duro fun igba diẹ ki o tun gbiyanju.'
          : 'Mama Titi is very busy right now! Please wait a moment and try again.'
        : isYoruba
          ? 'Iṣoro asopọ wa. Jọwọ ṣayẹwo intanẹẹti rẹ ki o tun gbiyanju!'
          : 'Connection problem. Please check your internet and try again!',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }
}

// ---------------------------------------------------------------------
// TTS AUDIO CACHE — IndexedDB
//
// Keyed by a hash of (cleaned text + voice + language). The single
// biggest source of "Loading Voice..." delay was that identical text
// (the welcome message above all — the same string for every guest,
// every session) was being re-synthesized from scratch every single
// time. This cache means the SECOND time any device ever needs that
// exact audio, it plays back instantly from local storage instead of
// making a network call at all. First-time-ever-on-this-device still
// needs the real network call — for that, the fix has to happen
// server-side in the yarngpt-proxy Edge Function (a separate, larger
// change), not here.
// ---------------------------------------------------------------------

const DB_NAME = 'funlylearn_tts_cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio';
// Cache entries older than this are treated as stale and refetched —
// mainly a hedge against the voice provider ever changing its output
// for the same text (a re-recorded phrase, a voice model update).
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function openTtsCacheDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function hashCacheKey(text: string, voice: string, language: string): Promise<string> {
  const raw = `${language}::${voice}::${text}`;
  try {
    const enc = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback for environments without SubtleCrypto — good enough for
    // a cache key, just not cryptographically strong (not needed here).
    let h = 0;
    for (let i = 0; i < raw.length; i++) {
      h = (h * 31 + raw.charCodeAt(i)) | 0;
    }
    return String(h);
  }
}

async function getCachedAudioBlob(key: string): Promise<Blob | null> {
  const db = await openTtsCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (entry && entry.blob && Date.now() - entry.storedAt < CACHE_MAX_AGE_MS) {
          resolve(entry.blob as Blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setCachedAudioBlob(key: string, blob: Blob): Promise<void> {
  const db = await openTtsCacheDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, blob, storedAt: Date.now() });
  } catch {
    // Caching is best-effort — a failed write just means no caching
    // benefit for this entry, never a broken app.
  }
}

// The exact text Mama Titi's voice is made from. Shared by the Listen
// button and the background recording, so both find the same saved clip.
export function normalizeSpeechText(raw: string): string {
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([.,!?:;])([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Records Mama Titi's answer in the background as soon as it appears, so
// "Listen" plays at once. The voice function only does this on your own
// free voice server (never on paid YarnGPT, so it never costs credits).
export function prefetchVoice(text: string, language: string): void {
  const clean = normalizeSpeechText(text);
  if (clean.length < 2 || clean.length > 1500) return;
  const isYorubaText = ['yo', 'yor', 'yoruba'].includes(String(language || '').toLowerCase());
  fetch(SUPABASE_FUNCTIONS_URL + '/yarngpt-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY
    },
    body: JSON.stringify({
      text: clean,
      language: isYorubaText ? 'yo' : 'en',
      voiceId: 'idera',
      childKey: getUsageUserKey() || undefined,
      authToken: getAccessToken() || undefined,
      prefetch: true
    })
  }).catch(() => {});
}

// A link Mama Titi's voice can be played from directly. The voice
// function sends a saved recording at once, or streams a new one as
// YarnGPT makes it, so she starts speaking within a second or two.
export function voiceStreamUrl(text: string, language: string): string {
  const isYorubaText = ['yo', 'yor', 'yoruba'].includes(String(language || '').toLowerCase());
  return (
    SUPABASE_FUNCTIONS_URL +
    '/yarngpt-proxy?text=' + encodeURIComponent(text) +
    '&language=' + (isYorubaText ? 'yo' : 'en') +
    '&voiceId=idera' +
    '&child=' + encodeURIComponent(getUsageUserKey() || '') +
    (getAccessToken() ? '&auth=' + encodeURIComponent(getAccessToken() as string) : '')
  );
}

export async function fetchAudioTTS(
  text: string,
  language: string
): Promise<{
  audioUrl?: string;
  useClientSpeech?: boolean;
  textToSpeak?: string;
  voice?: string;
  quotaMessage?: string;
  fromCache?: boolean;
  voiceLimit?: boolean;
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

    // Yorùbá text uses a YarnGPT Yorùbá voice (chosen in yarngpt-proxy);
    // everything else uses Idera, YarnGPT's English voice. The Yorùbá
    // label is new, so clips saved earlier (read with the English voice)
    // are never replayed.
    const isYorubaText = ['yo', 'yor', 'yoruba'].includes(String(language || '').toLowerCase());
    // Mama Titi speaks with Idera for everything. These labels are new, so
    // clips saved on phones before (including an old male Yorùbá voice)
    // are never replayed; every phrase is fetched fresh in Idera's voice.
    const voice = isYorubaText ? 'idera-yoruba-v4' : 'idera-english-v4';
    const cacheKey = await hashCacheKey(cleanText, voice, language);

    // Check the local cache first — this is what makes repeat text
    // (the welcome message, common celebration phrases, etc.) play
    // back instantly instead of re-hitting the network every time.
    const cachedBlob = await getCachedAudioBlob(cacheKey);
    if (cachedBlob) {
      const audioUrl = URL.createObjectURL(cachedBlob);
      return { audioUrl, voice, fromCache: true };
    }

    // Give the real voice provider a bounded amount of time — if it's
    // hanging (cold start, network trouble), fail fast and fall back
    // to client speech instead of leaving "Loading Voice..." stuck
    // indefinitely on screen. The server itself (yarngpt-proxy) can
    // take up to ~40s in the worst case (two 20s YarnGPT attempts back
    // to back on a genuine cache miss), so this needs to comfortably
    // exceed that — otherwise the client aborts a request that the
    // server would have eventually completed. Cache HITS (the common
    // case for repeated text) return in well under a second regardless.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let res: Response;
    try {
      res = await fetch(
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
            language: isYorubaText ? 'yo' : 'en',
            voiceId: 'idera',
            childKey: getUsageUserKey() || undefined,
            authToken: getAccessToken() || undefined
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error('YarnGPT error:', res.status, errText);

      // yarngpt-proxy sends back a friendly, actionable message with
      // quotaLikely: true when the daily voice limit has been hit.
      // Preserve that message instead of discarding it below.
      let quotaMsg: string | undefined;
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.code === 'VOICE_LIMIT') {
          throw new Error('VOICE_LIMIT:' + (errJson.error || 'Daily voice limit reached'));
        }
        if (errJson && (errJson.quotaLikely || errJson.code === 'QUOTA_EXCEEDED')) {
          quotaMsg = errJson.error || 'Out of credits';
        }
      } catch (parseErr) {
        // The daily-limit message must reach the caller.
        if (parseErr instanceof Error && parseErr.message.startsWith('VOICE_LIMIT:')) throw parseErr;
        // errText wasn't JSON — not a quota response, ignore.
      }

      throw new Error(
        quotaMsg ? 'QUOTA:' + quotaMsg : 'TTS network error: ' + res.status
      );
    }

    // yarngpt-proxy answers with a link to the saved recording
    // ({ audioUrl, cached }); fetch the MP3 from that link.
    let blob: Blob;
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!data || !data.audioUrl) {
        throw new Error('No audio link returned');
      }
      const audioRes = await fetch(data.audioUrl);
      if (!audioRes.ok) {
        throw new Error('Audio download failed: ' + audioRes.status);
      }
      blob = await audioRes.blob();
    } else {
      // Older version of the function: audio bytes directly.
      blob = await res.blob();
    }

    if (blob.size < 100) {
      throw new Error('Audio blob too small');
    }

    // Save to the local cache for next time — fire-and-forget, never
    // blocks or delays returning the audio to the caller.
    setCachedAudioBlob(cacheKey, blob);

    // Using a blob URL instead of converting to base64 — base64 adds
    // roughly a third more data plus a full encode/decode pass before
    // playback can start, which is fast enough to be invisible in a
    // desktop browser but noticeably slow inside a native app's
    // WebView (like this app's Android build). A blob URL points
    // directly at the audio data in memory, skipping that overhead.
    const audioUrl = URL.createObjectURL(blob);

    return { audioUrl, voice };
  } catch (err) {
    console.error('YarnGPT call failed:', err);
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.startsWith('VOICE_LIMIT:')) {
      // This child has used today's new voice recordings.
      return { voiceLimit: true };
    }

    if (msg.startsWith('QUOTA:')) {
      return {
        useClientSpeech: true,
        textToSpeak: text,
        quotaMessage: msg.replace('QUOTA:', '')
      };
    }

    return { useClientSpeech: true, textToSpeak: text };
  }
}
