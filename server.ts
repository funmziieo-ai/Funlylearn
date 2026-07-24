import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { NERDC_CURRICULUM } from './src/data/nerdcCurriculum';
import { NAIJA_LINGO_WORDS } from './src/data/naijaLingoData';
import { INITIAL_LEADERBOARD } from './src/data/leaderboardData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Memory cache for user sessions and parent approvals
const dbStore = {
  profiles: new Map(),
  chatHistories: new Map(),
  rewards: [
    { id: 'r1', title: '30 Mins Video Games', description: 'Unlocked by Mama Titi after completing Math homework', requiredStars: 100, requiredHomeworks: 3, isUnlocked: true, icon: 'gamepad' },
    { id: 'r2', title: 'Weekend Ice Cream Treat', description: 'Parent approval after 5 active study days', requiredStars: 250, requiredHomeworks: 5, isUnlocked: false, icon: 'icecream' },
    { id: 'r3', title: 'Extra Football Time', description: 'Unlocked after scoring 500 stars in Naija Lingo', requiredStars: 500, requiredHomeworks: 8, isUnlocked: false, icon: 'trophy' }
  ]
};

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'FunlyLearn', character: 'Mama Titi' });
});

// API: Get NERDC Curriculum Topics
app.get('/api/curriculum', (req, res) => {
  const { classLevel } = req.query;
  if (classLevel && typeof classLevel === 'string') {
    const filtered = NERDC_CURRICULUM.filter(t => t.classLevel.toLowerCase() === classLevel.toLowerCase());
    return res.json({ topics: filtered });
  }
  res.json({ topics: NERDC_CURRICULUM });
});

// API: Chat with Mama Titi (Gemini 3.6 Flash)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, childName, classLevel, language, isOutOfSchool, imageBase64, conversationHistory } = req.body;

    const matchedCurriculum = NERDC_CURRICULUM.filter(
      t => t.classLevel.toLowerCase() === (classLevel || 'Primary 4').toLowerCase()
    );
    const curriculumSummary = matchedCurriculum
      .map(c => `- ${c.subject}: ${c.topicName} (${c.description})`)
      .slice(0, 8)
      .join('\n');

    const systemInstruction = `You are Mama Titi, a warm, patient, wise, and highly encouraging Nigerian AI teacher character (illustrated as an auntie in a colorful headwrap gele and Ankara dress). You help Nigerian children from Primary 3 to SS3 with their homework.

CORE RULES:
1. POSITIONING: You are a homework companion, NOT a replacement for their class teacher.
2. STEP-BY-STEP SCAFFOLDING: NEVER give direct final homework answers directly! Guide the child step-by-step using rich Nigerian storytelling, everyday cultural analogies (e.g., buying plantain at Mile 12 or Bodija market, sharing Agege bread, pounding yam, Danfo bus speeds, Tortoise folklore, cassava farming, cooperative savings).
3. OFFICIAL CURRICULUM: Ground your hints and explanations in the official Nigerian NERDC curriculum for class level: ${classLevel || 'Primary 4'}.
Relevant NERDC Topics for ${classLevel || 'Primary 4'}:
${curriculumSummary}

4. OUT-OF-SCHOOL CHILDREN SUPPORT: ${
      isOutOfSchool
        ? `The child (${childName || 'my child'}) is currently out of school, catching up on the same Primary 3–SS3 NERDC path. Make them feel deeply empowered, respected, and loved. Praise their effort warmly!`
        : `The child is ${childName || 'my child'}.`
    }

5. LANGUAGE & VOICE:
   Primary teaching language: ${language === 'yo' ? 'FULL Yoruba only — do not mix in English words or phrases. Every sentence must be entirely in Yoruba, using natural, warm, everyday Yoruba a Nigerian parent or grandmother would speak.' : 'Nigerian English with warm, respectful African expressions'}. 
   - Keep sentences natural, clear, and easy to read along as audio.
   - End your response with ONE simple, encouraging question to check if the child understands the next step.
   - Limit length to ~150-200 words per message so it stays punchy and easy for audio narration.`;

    let promptContents: any = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const formattedHistory = conversationHistory.map(item => `${item.sender === 'user' ? 'Child' : 'Mama Titi'}: ${item.text}`).join('\n');
      promptContents.push({ text: `Previous Conversation:\n${formattedHistory}\n\nLatest Child Input: ${message || 'Please help me with this'}` });
    } else {
      promptContents.push({ text: message || 'Hello Mama Titi, can you help me learn?' });
    }

    if (imageBase64) {
      const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      promptContents.push({
        inlineData: {
          mimeType,
          data: cleanData
        }
      });
      promptContents.push({ text: 'Mama Titi, please look at this homework photo I snapped and help me understand it step by step!' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: promptContents },
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Well done, my child! Let's examine this homework together step by step.";

    res.json({
      reply: replyText,
      sender: 'mama_titi',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error: any) {
    console.error('Error in Mama Titi chat route:', error);
    res.status(500).json({
      reply: "Ah, my child, Mama Titi's network dipped for a moment! Let's try again. Tell me what topic you are solving!",
      error: error.message
    });
  }
});

let runtimeYarnApiKey = process.env.YARNGPT_API_KEY || '';

function getVoiceConfigStatus() {
  const effectiveYarnKey = (runtimeYarnApiKey || process.env.YARNGPT_API_KEY || '').trim();
  const hasYarn = effectiveYarnKey.length > 0;

  return {
    yarnGptConfigured: hasYarn,
    hasYarnGptKey: hasYarn,
    yarnGptKeyMasked: hasYarn ? `${effectiveYarnKey.slice(0, 4)}••••••••${effectiveYarnKey.slice(-3)}` : ''
  };
}

// API: Secret space voice config endpoint
app.get('/api/config/voice', (req, res) => {
  res.json(getVoiceConfigStatus());
});

app.post('/api/config/voice', (req, res) => {
  const { yarnApiKey, apiKey } = req.body;
  const key = yarnApiKey || apiKey;
  if (typeof key === 'string') runtimeYarnApiKey = key.trim();

  const status = getVoiceConfigStatus();
  return res.json({
    success: true,
    config: status,
    message: status.yarnGptConfigured 
      ? 'YarnGPT API Key saved! Idera Yoruba Voice is now active.' 
      : 'YarnGPT API Key updated.'
  });
});

// Legacy backward-compatibility endpoints
app.get('/api/config/yarngpt', (req, res) => {
  const status = getVoiceConfigStatus();
  res.json({
    configured: status.yarnGptConfigured,
    keyMasked: status.yarnGptKeyMasked,
    voice: 'Idera (YarnGPT Yoruba)'
  });
});

app.post('/api/config/yarngpt', (req, res) => {
  const { apiKey, yarnApiKey } = req.body;
  const key = yarnApiKey || apiKey;
  if (typeof key === 'string') runtimeYarnApiKey = key.trim();

  const status = getVoiceConfigStatus();
  res.json({
    success: true,
    configured: status.yarnGptConfigured,
    keyMasked: status.yarnGptKeyMasked,
    message: 'YarnGPT API Key saved for Idera Yoruba Voice.'
  });
});

// Server-side Audio Cache per unique text string
const audioCache = new Map<string, { audioBase64: string; voice: string }>();

// API: TTS Route (Idera via YarnGPT for Yoruba, Client Speech Synthesis for English)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language, voice } = req.body;
    const voiceToUse = voice || 'Idera';
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const cacheKey = `${voiceToUse}:${cleanText.toLowerCase()}`;

    // Requirement 6: Check cache first
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return res.json({
        success: true,
        voice: cached.voice,
        yarnGptConfigured: true,
        audioBase64: cached.audioBase64,
        cached: true
      });
    }

    const yarnApiKey = (runtimeYarnApiKey || process.env.YARNGPT_API_KEY || '').trim();

    // Try YarnGPT if key is present or if Yoruba language/voice requested
    if (yarnApiKey && yarnApiKey.length > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const yarnResponse = await fetch('https://yarngpt.ai/api/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${yarnApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cleanText,
            voice: voiceToUse
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (yarnResponse.ok) {
          let finalAudioBase64 = '';
          const contentType = yarnResponse.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            const json = await yarnResponse.json();
            const audioSrc = json.audio_url || json.url || json.audio || json.audioBase64 || json.audio_base64;
            if (audioSrc) {
              finalAudioBase64 = audioSrc.startsWith('http') || audioSrc.startsWith('data:')
                ? audioSrc
                : `data:audio/mp3;base64,${audioSrc}`;
            }
          } else {
            const audioBuffer = await yarnResponse.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');
            finalAudioBase64 = `data:audio/mp3;base64,${base64Audio}`;
          }

          if (finalAudioBase64) {
            audioCache.set(cacheKey, { audioBase64: finalAudioBase64, voice: `${voiceToUse} (YarnGPT)` });
            return res.json({
              success: true,
              voice: `${voiceToUse} (YarnGPT)`,
              yarnGptConfigured: true,
              audioBase64: finalAudioBase64
            });
          }
        }
      } catch (_yarnErr) {
        // Quietly catch network or timeout errors to allow graceful client fallback
      }
    }

    // Fallback if Yoruba without key or YarnGPT failure
    if (language === 'yo') {
      return res.json({
        success: true,
        voice: 'Idera (YarnGPT Yoruba Mode)',
        yarnGptConfigured: false,
        useClientSpeech: true,
        textToSpeak: cleanText
      });
    }

    // English Mode: Use Web Speech Synthesis with Nigerian/English accent
    return res.json({
      success: true,
      voice: 'Mama Titi (English - Web Speech)',
      useClientSpeech: true,
      textToSpeak: text
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: Naija Lingo Words
app.get('/api/lingo', (req, res) => {
  res.json({ words: NAIJA_LINGO_WORDS });
});

// API: Leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json({ users: INITIAL_LEADERBOARD });
});

// API: Parent Dashboard & Rewards
app.get('/api/parent-rewards', (req, res) => {
  res.json({ rewards: dbStore.rewards });
});

app.post('/api/parent-reward/approve', (req, res) => {
  const { rewardId } = req.body;
  const reward = dbStore.rewards.find(r => r.id === rewardId);
  if (reward) {
    reward.isUnlocked = true;
    return res.json({ success: true, reward });
  }
  res.status(404).json({ error: 'Reward not found' });
});

// Setup Vite development server or serve static assets in production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FunlyLearn server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
