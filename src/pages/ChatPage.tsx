import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, X, Upload, Crop, RefreshCw } from 'lucide-react';
import { UserProfile, ChatMessage, UserSubscription } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
import { SyncedReadAlong } from '../components/SyncedReadAlong';
import { CameraUploadModal } from '../components/CameraUploadModal';
import { HomeworkCropModal } from '../components/HomeworkCropModal';
import {
  sendMessageToMamaTiti,
  getStoredChat,
  saveStoredChat,
  clearStoredChat,
  getWelcomeMessage
} from '../services/apiClient';
import { saveHomeworkRecord, saveAppPollResponse } from '../services/supabaseService';
import { getUnlockedLevels } from '../utils/coinsSystem';

interface ChatPageProps {
  profile: UserProfile;
  subscription?: UserSubscription;
  dailyMessagesCount: number;
  onIncrementDailyMessages: () => number;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenPricingModal: () => void;
  onGoToLingo?: () => void;
  isGuest?: boolean;
  userId: string;
}

const FREE_DAILY_MESSAGE_LIMIT = 5;

// Quick multiple-choice app polls — shown one at a time as the child
// uses the app, never all at once and never repeating a question
// already answered. Once every question here has been answered, no
// more popups ever appear. Replaces the earlier thumbs up/down
// reactions with something lower-friction and more structured.
const APP_POLL_QUESTIONS: { id: string; question: string; options: string[] }[] = [
  {
    id: 'poll_helpfulness',
    question: 'How is FunlyLearn working for your child so far?',
    options: ['😊 Really helpful', '🙂 Pretty good', '😐 It\'s okay', '😕 Needs work']
  },
  {
    id: 'poll_ease',
    question: 'Is the app easy for your child to use on their own?',
    options: ['😊 Very easy', '🙂 Mostly easy', '😐 A bit tricky', '😕 Too confusing']
  },
  {
    id: 'poll_voice',
    question: 'How do you feel about Mama Titi\'s voice?',
    options: ['😊 Love it', '🙂 It\'s good', '😐 Hit or miss', '😕 Rarely works']
  }
];
const POLL_TRIGGER_MESSAGE_COUNT = 3;
const POLL_STORAGE_KEY = 'funlylearn_answered_polls';

// A user has full (Basic/Family) access if they have an active paid
// plan, OR are still inside a valid trial period. Everyone else is
// on the real Free tier limits — this was previously never checked
// anywhere, so every user had unrestricted access regardless of plan.
function isPremiumActive(subscription?: UserSubscription): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active' && subscription.plan !== 'free') {
    return true;
  }
  if (subscription.status === 'trial' && subscription.expiresAt) {
    return new Date(subscription.expiresAt).getTime() > Date.now();
  }
  return false;
}

const FUN_LOADING_MESSAGES_EN = [
  'Mama Titi is cooking up a story for you',
  'Getting a Nigerian story ready',
  'Mama Titi is thinking of Tunde and Amaka',
  'Visiting Ojuelegba market for ideas',
  'Stirring the egusi soup of knowledge',
  'Mama Titi is on her way',
  'Checking the NERDC curriculum',
  'Packing wisdom from Lagos',
  'Almost ready my dear scholar',
  'Mama Titi says good morning',
];

const FUN_LOADING_MESSAGES_YO = [
  'Mama Titi n pese itan fun e',
  'A n lọ si oja Balogun fun imọran',
  'Mama Titi n ronu nipa Tunde ati Amaka',
  'N ṣe eba ati egusi ti imo',
  'Mama Titi n bọ wa',
  'N ṣayẹwo eto ẹkọ NERDC',
  'N ko ọgbọn lati Lagos wa',
  'Fẹrẹ ti pari ọmọ mi olooye',
  'Mama Titi n wa pẹlu itan',
  'Suuru ọmọ mi olooye',
];

const CELEBRATION_MESSAGES_EN = [
  'You are a genius!',
  'Mama Titi is so proud of you!',
  'Gold star for you today!',
  'You are an absolute superstar!',
  'JAMB and WAEC are not your mate!',
  'Brilliant Nigerian scholar!',
  'Your parents will be so proud!',
  'You are going to the top!',
];

const CELEBRATION_MESSAGES_YO = [
  'Ọmọ olooye ni e!',
  'Mama Titi ni igberaga fun e gan an!',
  'Irawọ wura fun e loni!',
  'E jẹ ẹlẹgàn nla kan!',
  'JAMB ati WAEC kii ṣe ẹlẹgàn rẹ!',
  'Akẹkọ Naijiria ti o ni ọgbọn!',
  'Awọn obi rẹ yoo ni igberaga!',
  'O n lọ si oke!',
];

export const ChatPage: React.FC<ChatPageProps> = ({
  profile,
  subscription,
  dailyMessagesCount,
  onIncrementDailyMessages,
  onProfileUpdate,
  onOpenPricingModal,
  onGoToLingo,
  isGuest = false,
  userId
}) => {
  const isYoruba = profile.language === 'yo';

  const [messages, setMessages] = useState<ChatMessage[]>(
    () => getStoredChat(profile.language)
  );
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Tracks the current "study session" — a group of exchanges on the
  // same topic, from first attempt through to the child finally
  // getting it right. Persists across retries (wrong answers), and
  // resets to a fresh id once the child answers correctly, so the next
  // question starts its own new session rather than continuing this
  // one. Used to group the notebook's "how Mama Titi explained it"
  // view — currently scoped to Math only, since that's where we have
  // real, substantial curriculum content.
  //
  // Stored in localStorage rather than pure component state — pure
  // state was lost on any remount (switching tabs, a page refresh),
  // silently starting a new disconnected session even mid-conversation,
  // which meant the final correct answer sometimes never joined the
  // earlier attempts it belonged with.
  const SESSION_ID_KEY = 'funlylearn_current_math_session';
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(SESSION_ID_KEY);
      if (stored) return stored;
    } catch (e) {}
    const fresh = crypto.randomUUID();
    try {
      localStorage.setItem(SESSION_ID_KEY, fresh);
    } catch (e) {}
    return fresh;
  });

  const startNewSession = () => {
    const fresh = crypto.randomUUID();
    try {
      localStorage.setItem(SESSION_ID_KEY, fresh);
    } catch (e) {}
    setCurrentSessionId(fresh);
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [coinsEarnedToast, setCoinsEarnedToast] = useState<number | null>(null);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [answeredPollIds, setAnsweredPollIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(POLL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [activePoll, setActivePoll] = useState<typeof APP_POLL_QUESTIONS[number] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userCoins = profile.coins || 0;
  const isPremium = isPremiumActive(subscription);
  const dailyLimitReached = !isPremium && dailyMessagesCount >= FREE_DAILY_MESSAGE_LIMIT;
  const loadingMessages = isYoruba ? FUN_LOADING_MESSAGES_YO : FUN_LOADING_MESSAGES_EN;
  const celebrationMessages = isYoruba ? CELEBRATION_MESSAGES_YO : CELEBRATION_MESSAGES_EN;

  const playCelebrationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + i * 0.15 + 0.3
        );
        oscillator.start(audioCtx.currentTime + i * 0.15);
        oscillator.stop(audioCtx.currentTime + i * 0.15 + 0.3);
      });
    } catch (_e) {}
  };

  useEffect(() => {
    saveStoredChat(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length < 3) return;

    const lastMsg = messages[messages.length - 1];
    const secondLastMsg = messages[messages.length - 2];

    const childAnswered = secondLastMsg?.sender === 'user';
    const mamaReplied = lastMsg?.sender === 'mama_titi';
    const isCorrect =
      (lastMsg?.text?.toLowerCase().includes('ehhh') ||
        lastMsg?.text?.toLowerCase().includes('o ti gba a')) &&
      !lastMsg?.text?.toLowerCase().includes('welcome') &&
      !lastMsg?.text?.toLowerCase().includes('kaaro') &&
      messages.length > 2;

    if (childAnswered && mamaReplied && isCorrect) {
      setShowCelebration(true);
      setCelebrationCount(c => c + 1);
      playCelebrationSound();
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      let idx = 0;
      setLoadingMessage(loadingMessages[0]);
      loadingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[idx]);
      }, 1800);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Picks the next unanswered poll question and shows it — called after
  // a few real exchanges. Does nothing once every question in the set
  // has been answered (the "disappears when all questions have been
  // answered" behavior).
  const maybeShowPoll = () => {
    if (activePoll) return;
    const nextUnanswered = APP_POLL_QUESTIONS.find(
      p => !answeredPollIds.includes(p.id)
    );
    if (nextUnanswered) {
      setActivePoll(nextUnanswered);
    }
  };

  const handlePollAnswer = (answer: string) => {
    if (!activePoll) return;
    saveAppPollResponse(userId, activePoll.question, answer);
    const updated = [...answeredPollIds, activePoll.id];
    setAnsweredPollIds(updated);
    try {
      localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setActivePoll(null);
  };

  const handleDismissPoll = () => {
    // Dismissing doesn't count as answered — it'll be offered again
    // after the next few exchanges, rather than being lost entirely.
    setActivePoll(null);
  };

  const handleNewChat = () => {
    setShowNewChatConfirm(true);
  };

  const confirmNewChat = () => {
    clearStoredChat();
    setMessages([getWelcomeMessage(profile.language)]);
    setInputText('');
    setCroppedImage(null);
    setRawImageSrc(null);
    setShowNewChatConfirm(false);
    startNewSession();
  };

  // Homework Snap is now open to everyone, including Free tier — this
  // lets a family experience the feature (increasingly standard across
  // competitor apps) before deciding to upgrade, rather than hitting a
  // hard wall immediately. Usage is still naturally capped: a snap goes
  // through handleSend just like a typed question, so Free users get
  // up to FREE_DAILY_MESSAGE_LIMIT total interactions/day (snaps and
  // questions combined), enforced by the existing dailyLimitReached
  // check in handleSend — no separate quota needed.
  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleOpenUpload = () => {
    directFileInputRef.current?.click();
  };

  const handleSend = async (
    overrideText?: string,
    imagePayload?: string
  ) => {
    const textToSend = overrideText || inputText;
    const imgToSend = imagePayload || croppedImage;
    if (!textToSend.trim() && !imgToSend) return;

    // Real enforcement of the Free tier's daily message limit — this
    // was previously never checked, so every user had unlimited
    // messages regardless of subscription status.
    if (dailyLimitReached) {
      onOpenPricingModal();
      return;
    }

    const defaultImageText = isYoruba
      ? 'Mama Titi jọwọ wo aworan iṣẹ ile mi ki o ran mi lọwọ!'
      : 'Mama Titi please analyze this homework photo for me!';

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: textToSend.trim() || defaultImageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      imagePath: imgToSend || undefined
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setCroppedImage(null);
    setRawImageSrc(null);
    setIsLoading(true);
    setLoadingMessage(loadingMessages[0]);

    try {
      const response = await sendMessageToMamaTiti({
        message: userMsg.text,
        profile,
        imageBase64: imgToSend || undefined,
        conversationHistory: newHistory.slice(-6)
      });

      const mamaMsg: ChatMessage = {
        id: 'm-' + Date.now(),
        sender: 'mama_titi',
        text: response.reply,
        curriculumVerified: response.curriculumVerified || false,
        timestamp:
          response.timestamp ||
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
      };

      setMessages(prev => [...prev, mamaMsg]);

      const isCorrect =
        response.reply.toLowerCase().includes('ehhh') ||
        response.reply.toLowerCase().includes('o ti gba a');

      const currentStreak = isCorrect
        ? (profile.correctStreak || 0) + 1
        : 0;
      const streakBonus =
        isCorrect && currentStreak % 3 === 0 ? 20 : 0;
      const coinsEarned = isCorrect
        ? 10 + streakBonus
        : imgToSend
        ? 5
        : 0;

      if (coinsEarned > 0) {
        setCoinsEarnedToast(coinsEarned);
        setTimeout(() => setCoinsEarnedToast(null), 2500);
      }

      // Count this message toward the Free tier's daily limit — was
      // previously never called, so the limit check above always saw 0.
      if (!isPremium) {
        onIncrementDailyMessages();
      }

      onProfileUpdate({
        ...profile,
        stars: profile.stars + (isCorrect ? 10 : 0),
        coins: (profile.coins || 0) + coinsEarned,
        correctStreak: isCorrect ? currentStreak : 0,
        totalCorrect:
          (profile.totalCorrect || 0) + (isCorrect ? 1 : 0),
        homeworksSnapped: imgToSend
          ? (profile.homeworksSnapped || 0) + 1
          : profile.homeworksSnapped || 0,
        lingoLevel: getUnlockedLevels(
          (profile.coins || 0) + coinsEarned
        ).length
      });

      // Log a real record of what was actually worked on, so the
      // Parent Dashboard and Notebook can show genuine sessions instead
      // of mock data. "topic" is the child's own message, "mamaReply"
      // is Mama Titi's actual explanation — both saved now, so the
      // notebook can show real study content, not just a bare log.
      // sessionId groups this with any earlier retries on the same
      // topic. Currently scoped to Math only (response.subject ===
      // 'Mathematics') for the full session-grouped notebook view,
      // since that's where we have real, substantial content — a
      // deliberate, known scope limit while this feature proves out,
      // not a bug. Other subjects still log normally, just without
      // session grouping in the notebook yet.
      const isMathSession = response.subject === 'Mathematics';
      saveHomeworkRecord(
        userId,
        userMsg.text.slice(0, 120),
        isCorrect,
        response.subject || undefined,
        isMathSession ? currentSessionId : undefined,
        response.reply
      );

      // Once the child gets it right, this topic is resolved — the
      // next question should start its own fresh session, not continue
      // grouping with this one.
      if (isCorrect) {
        startNewSession();
      }

      // Show a quick app poll after a few real exchanges, using the
      // count of the child's own messages so far in this session.
      const userMessageCount = newHistory.filter(m => m.sender === 'user').length;
      if (userMessageCount >= POLL_TRIGGER_MESSAGE_COUNT) {
        maybeShowPoll();
      }

      // Automatic parent update — opens WhatsApp pre-filled the moment
      // a parent number is saved, instead of requiring the child to
      // remember to visit the Parent Dashboard and tap "Tell Parents"
      // manually. Note: WhatsApp itself requires a human tap to
      // actually send (no fully silent sending is possible without
      // WhatsApp's paid Business API) — this removes the "hunt for the
      // button" step, not the final send tap. Tied to the same every-
      // 3rd-correct-answer rhythm as the streak bonus, so parents get
      // real updates at genuine celebration moments rather than being
      // pinged (and the child interrupted) after every single answer.
      if (isCorrect && currentStreak % 3 === 0 && profile.parentWhatsApp) {
        const parentMessage = encodeURIComponent(
          `🌟 *Mama Titi Learning Update* 🌟\n\nHello! ${profile.name} just answered correctly with Mama Titi! 🎉\n\nTotal Stars: ⭐ ${profile.stars + (isCorrect ? 10 : 0)}\nKeep encouraging ${profile.name}! 🇳🇬`
        );
        window.open(`https://wa.me/${profile.parentWhatsApp}?text=${parentMessage}`, '_blank');
      }
    } catch (err) {
      console.error('Error getting response from Mama Titi:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'mama_titi',
        text: isYoruba
          ? 'Iṣoro asopọ wa. Jọwọ ṣayẹwo intanẹẹti rẹ ki o tun gbiyanju!'
          : 'Connection problem. Please check your internet and try again!',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRawImageSelected = (base64: string) => {
    setRawImageSrc(base64);
    setIsCropperOpen(true);
  };

  const handleDirectFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          handleRawImageSelected(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (
    croppedBase64: string,
    originalBase64: string
  ) => {
    setCroppedImage(croppedBase64);
    setRawImageSrc(originalBase64);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          handleRawImageSelected(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto bg-[#FFFBF5] relative overflow-hidden"
    >

      {/* New Chat Confirmation — replaces the jarring native browser confirm() */}
      {showNewChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 max-w-sm w-full shadow-2xl border-2 border-emerald-200">
            <div className="text-4xl">💬</div>
            <h3 className="font-serif font-bold text-lg text-[#064E3B]">
              {isYoruba ? 'Bẹrẹ Ibaraẹnisọrọ Tuntun?' : 'Start a New Chat?'}
            </h3>
            <p className="text-sm text-slate-500">
              {isYoruba
                ? 'Ìbáraẹnisọ̀rọ̀ yìí yóò parẹ́, a óò sì bẹ̀rẹ̀ tuntun pẹ̀lú Mama Titi.'
                : 'This will clear your current chat and start fresh with Mama Titi.'}
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                {isYoruba ? 'Fagilee' : 'Cancel'}
              </button>
              <button
                onClick={confirmNewChat}
                className="flex-1 py-3 rounded-full bg-[#064E3B] hover:bg-[#022C22] text-white font-bold text-sm transition-all"
              >
                {isYoruba ? 'Bẹ̀rẹ̀ Tuntun' : 'Start New'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick App Poll Popup — one question at a time, from a rotating
          set, never repeating an answered one, never showing once
          they're all answered. */}
      {activePoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 max-w-sm w-full shadow-2xl border-2 border-amber-300 relative">
            <button
              onClick={handleDismissPoll}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-4xl">💭</div>
            <h3 className="font-serif font-bold text-base text-[#064E3B] px-2">
              {activePoll.question}
            </h3>
            <div className="space-y-2 pt-1">
              {activePoll.options.map(option => (
                <button
                  key={option}
                  onClick={() => handlePollAnswer(option)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-sm font-medium text-slate-800 text-left transition-all"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Celebration Splash */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center space-y-4 mx-6 shadow-2xl border-4 border-amber-400">
            <div className="text-7xl animate-bounce">🎉</div>
            <h2 className="font-serif font-bold text-2xl text-[#064E3B]">
              {isYoruba ? 'Ehhh! O Ti Gba A!' : 'Ehhh! You Got It!'}
            </h2>
            <p className="text-slate-600 font-sans text-sm">
              {celebrationMessages[celebrationCount % celebrationMessages.length]}
            </p>
            <div className="flex justify-center space-x-3 text-4xl">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>⭐</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>⭐</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>⭐</span>
            </div>
            <div className="bg-amber-50 rounded-2xl px-4 py-2 border border-amber-200">
              <p className="text-amber-700 font-bold text-sm">
                {isYoruba ? '+10 owó ere! 🪙' : '+10 coins earned! 🪙'}
              </p>
              <p className="text-amber-600 text-xs">
                {isYoruba ? 'Apapọ: ' : 'Total: '}{userCoins + 10} {isYoruba ? 'owó' : 'coins'}
              </p>
            </div>
            <div className="flex justify-center space-x-2 text-2xl">
              <span>🇳🇬</span>
              <span>🏆</span>
              <span>🇳🇬</span>
            </div>
            <div className="flex flex-col space-y-2">
              {onGoToLingo && (
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    onGoToLingo();
                  }}
                  className="px-6 py-2 rounded-full bg-[#5B21B6] text-white text-sm font-bold flex items-center justify-center space-x-2"
                >
                  <span>🌍</span>
                  <span>{isYoruba ? 'Lọ Kọ Yoruba!' : 'Go Learn Yoruba!'}</span>
                </button>
              )}
              <button
                onClick={() => setShowCelebration(false)}
                className="px-6 py-2 rounded-full bg-[#064E3B] text-white text-sm font-bold"
              >
                {isYoruba ? 'Tẹsiwaju!' : 'Keep Going!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coins Toast */}
      {coinsEarnedToast && (
        <div className="fixed top-20 right-4 z-40 bg-amber-400 text-slate-900 px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce">
          +{coinsEarnedToast} 🪙 {isYoruba ? 'owó ere!' : 'coins earned!'}
        </div>
      )}

      <input
        type="file"
        ref={directFileInputRef}
        accept="image/*"
        onChange={handleDirectFileChange}
        className="hidden"
      />

      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#064E3B]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center border-4 border-dashed border-amber-400">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-amber-300">
            {isYoruba ? 'Sọ Aworan Iṣẹ Ile Silẹ Nibi' : 'Drop Homework Photo Here'}
          </h3>
        </div>
      )}

      {/* Header — avatar removed here since Navbar already shows Mama Titi's photo app-wide; coins/language also live in Navbar */}
      <div className="bg-[#064E3B] text-white p-3 sm:p-4 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="font-serif font-bold text-lg leading-tight">
              {isYoruba ? `Ẹ ku ọjọ, ${profile.name}!` : `Welcome, ${profile.name}!`}
            </h2>
          </div>
        </div>
      </div>

      {/* Snap Homework Bar — tapping the banner itself opens Snap (camera), not Upload. New Chat now lives here too, beside Snap/Upload. Basic/Family feature — gated for Free tier. Small top margin added so it doesn't feel flush against the header above it. */}
      <div
        onClick={handleOpenCamera}
        className="mt-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 p-2.5 px-3.5 sm:px-4 shadow-sm flex items-center justify-between shrink-0 rounded-2xl mx-2 cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-950 text-amber-300 rounded-xl">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif font-bold text-xs sm:text-sm leading-tight text-slate-950">
              {isYoruba ? 'Ṣe Aworan Iṣẹ Ile Rẹ' : 'Snap Your Homework'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-800 font-sans">
              {isYoruba
                ? 'Gba owó ere 5 fun aworan iṣẹ ile kọọkan!'
                : 'Earn 5 coins per homework snap!'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenUpload();
            }}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all flex items-center space-x-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isYoruba ? 'Gbe Soke' : 'Upload'}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewChat();
            }}
            className="px-3 py-1.5 rounded-full bg-red-900/80 hover:bg-red-800 text-red-100 font-bold text-xs transition-all flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isYoruba ? 'Ibaraẹnisọrọ Tuntun' : 'New Chat'}</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-44">
        {messages.map((msg, idx) => {
          const isMama = msg.sender === 'mama_titi';
          return (
            <React.Fragment key={msg.id}>
              <div
                className={
                  'flex flex-col ' +
                  (isMama ? 'items-start' : 'items-end') +
                  ' space-y-1'
                }
              >
                <div
                  className={
                    'max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 shadow-md transition-all ' +
                    (isMama
                      ? 'bg-white text-slate-900 rounded-tl-xs border-2 border-emerald-600/30'
                      : 'bg-[#FFE8DE] text-slate-900 rounded-tr-xs border border-[#FF6B35]/30')
                  }
                >
                  {msg.imagePath && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-amber-300/60 max-h-56 bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src={msg.imagePath}
                        alt="Homework"
                        className="w-full max-h-56 object-contain rounded-xl"
                      />
                    </div>
                  )}
                  {isMama ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-emerald-100">
                        <span className="font-serif font-bold text-xs text-[#064E3B]">
                          Mama Titi
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {msg.curriculumVerified && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                              <span>✓</span>
                              <span>{isYoruba ? 'Ẹ̀kọ́ Tí A Fọwọ́ Sí' : 'Curriculum Verified'}</span>
                            </span>
                          )}
                          <span className="text-[10px] bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                            {isYoruba ? 'Ohun Olukọ AI' : 'AI Teacher Voice'}
                          </span>
                        </div>
                      </div>
                      <SyncedReadAlong
                        text={msg.text}
                        language={profile.language}
                        autoPlay={
                          isMama &&
                          idx === messages.length - 1 &&
                          !isLoading
                        }
                        onSpeechStateChange={speaking =>
                          setSpeakingMessageId(
                            speaking ? msg.id : null
                          )
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-sans leading-relaxed font-medium text-slate-900">
                      {msg.text}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-sans px-2">
                  {isMama ? 'Mama Titi · ' : (isYoruba ? 'Iwọ · ' : 'You · ')}
                  {msg.timestamp}
                </span>
              </div>
            </React.Fragment>
          );
        })}

        {/* Suggested question chips — shown only on a fresh conversation
            (just the welcome message, nothing typed yet), giving a
            first-time user something purposeful to tap immediately
            instead of a large empty screen. Disappears once a real
            conversation starts. */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 -mt-2">
            {(isYoruba
              ? [
                  'Ran mi lọwọ pẹlu Iṣiro',
                  'Ṣalaye ọrọ kan fun mi',
                  'Ran mi lọwọ pẹlu Gẹẹsi'
                ]
              : [
                  'Help me with Math',
                  'Explain a word for me',
                  'Help me with English'
                ]
            ).map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="px-3.5 py-2 rounded-full bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-xs font-jakarta font-bold text-[#064E3B] transition-all shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Fun Loading — avatar removed here, only the header avatar remains */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="bg-white rounded-3xl rounded-tl-xs border-2 border-emerald-600/30 px-4 py-3 shadow-md max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <p className="text-xs text-emerald-700 font-medium italic">
                {loadingMessage}...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Cropped Image Preview */}
      {croppedImage && (
        <div className="fixed bottom-[144px] sm:bottom-[149px] left-0 right-0 max-w-2xl mx-auto px-3 z-30">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 px-3.5 rounded-2xl border-2 border-amber-400 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-300 bg-black/40 shrink-0">
                <img
                  src={croppedImage}
                  alt="Cropped Homework"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate space-y-0.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1">
                  <Crop className="w-3 h-3 text-slate-950" />
                  <span>
                    {isYoruba ? 'Ibeere Ti Ge Tan' : 'Cropped Question Ready'}
                  </span>
                </span>
                <p className="text-[11px] text-emerald-300 font-medium">
                  {isYoruba ? 'Ṣetan fun Mama Titi' : 'Ready for Mama Titi'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setIsCropperOpen(true)}
                className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs transition-colors flex items-center space-x-1"
              >
                <Crop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setCroppedImage(null);
                  setRawImageSrc(null);
                }}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Input Bar */}
      <div className="fixed bottom-[80px] sm:bottom-[84px] left-0 right-0 max-w-2xl mx-auto px-3 pb-1 z-30">
        {dailyLimitReached && (
          <button
            onClick={onOpenPricingModal}
            className="w-full mb-2 py-2.5 px-4 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 text-xs font-bold text-center shadow-md"
          >
            {isYoruba
              ? `Ẹ ti dé opin ọrọ ọjọ́ (${FREE_DAILY_MESSAGE_LIMIT}). Tẹ láti ṣe igbesoke!`
              : `You've reached today's ${FREE_DAILY_MESSAGE_LIMIT} free messages. Tap to upgrade!`}
          </button>
        )}
        <div className="bg-white/95 backdrop-blur-md rounded-full border-2 border-slate-300 shadow-2xl p-1.5 flex items-center space-x-2">
          <button
            onClick={handleOpenUpload}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#064E3B] transition-all"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCamera}
            className="p-2.5 rounded-full bg-[#FFE8DE] hover:bg-[#FFD0BE] text-[#FF6B35] font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={
              isYoruba
                ? croppedImage
                  ? 'Beere Mama Titi nipa aworan yii...'
                  : 'Beere Mama Titi ohunkohun tabi ṣe aworan iṣẹ ile...'
                : croppedImage
                ? 'Ask Mama Titi about this photo...'
                : 'Ask Mama Titi anything or snap homework...'
            }
            className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-slate-800 placeholder:text-slate-400 px-2"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !croppedImage}
            className="p-3 rounded-full bg-[#FF6B35] hover:bg-[#E85523] disabled:opacity-40 text-white font-bold transition-all shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CameraUploadModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onImageSelected={handleRawImageSelected}
      />
      <HomeworkCropModal
        isOpen={isCropperOpen}
        initialImageSrc={rawImageSrc}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
