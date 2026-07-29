import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Loader2, X, Upload, Crop, RefreshCw } from 'lucide-react';
import { UserProfile, ChatMessage, UserSubscription } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
import { SyncedReadAlong } from '../components/SyncedReadAlong';
import { CameraUploadModal } from '../components/CameraUploadModal';
import { HomeworkCropModal } from '../components/HomeworkCropModal';
import { sendMessageToMamaTiti, getStoredChat, saveStoredChat, clearStoredChat, getWelcomeMessage } from '../services/apiClient';
import { getUnlockedLevels } from '../utils/coinsSystem';
import { StoryVisual } from '../components/StoryVisual';

interface ChatPageProps {
  profile: UserProfile;
  subscription?: UserSubscription;
  dailyMessagesCount: number;
  onIncrementDailyMessages: () => number;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenPricingModal: () => void;
  isGuest?: boolean;
}

const FUN_LOADING_MESSAGES = [
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

const CELEBRATION_MESSAGES = [
  'You are a genius!',
  'Mama Titi is so proud of you!',
  'Gold star for you today!',
  'You are an absolute superstar!',
  'JAMB and WAEC are not your mate!',
  'Brilliant Nigerian scholar!',
  'Your parents will be so proud!',
  'You are going to the top!',
];

export const ChatPage: React.FC<ChatPageProps> = ({
  profile,
  subscription,
  dailyMessagesCount,
  onIncrementDailyMessages,
  onProfileUpdate,
  onOpenPricingModal,
  isGuest = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => getStoredChat()
  );
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(FUN_LOADING_MESSAGES[0]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [coinsEarnedToast, setCoinsEarnedToast] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userCoins = profile.coins || 0;

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
      lastMsg?.text?.toLowerCase().includes('ehhh') &&
      !lastMsg?.text?.toLowerCase().includes('welcome') &&
      !lastMsg?.text?.toLowerCase().includes('what class');

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
      loadingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % FUN_LOADING_MESSAGES.length;
        setLoadingMessage(FUN_LOADING_MESSAGES[idx]);
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

  const handleNewChat = () => {
    if (window.confirm('Start a fresh new chat with Mama Titi?')) {
      clearStoredChat();
      setMessages([getWelcomeMessage()]);
      setInputText('');
      setCroppedImage(null);
      setRawImageSrc(null);
    }
  };

  const handleSend = async (
    overrideText?: string,
    imagePayload?: string
  ) => {
    const textToSend = overrideText || inputText;
    const imgToSend = imagePayload || croppedImage;
    if (!textToSend.trim() && !imgToSend) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text:
        textToSend.trim() ||
        'Mama Titi please analyze this homework photo for me!',
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
    setLoadingMessage(FUN_LOADING_MESSAGES[0]);

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
        timestamp:
          response.timestamp ||
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
      };

      setMessages(prev => [...prev, mamaMsg]);

      const isCorrect = response.reply.toLowerCase().includes('ehhh');
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
    } catch (err) {
      console.error('Error getting response from Mama Titi:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'mama_titi',
        text: 'Connection problem. Please check your internet and try again!',
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
      {/* Celebration Splash */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center space-y-4 mx-6 shadow-2xl border-4 border-amber-400">
            <div className="text-7xl animate-bounce">🎉</div>
            <h2 className="font-serif font-bold text-2xl text-[#064E3B]">
              Ehhh! You Got It!
            </h2>
            <p className="text-slate-600 font-sans text-sm">
              {CELEBRATION_MESSAGES[celebrationCount % CELEBRATION_MESSAGES.length]}
            </p>
            <div className="flex justify-center space-x-3 text-4xl">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>⭐</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>⭐</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>⭐</span>
            </div>
            <div className="bg-amber-50 rounded-2xl px-4 py-2 border border-amber-200">
              <p className="text-amber-700 font-bold text-sm">
                +10 coins earned! 🪙
              </p>
              <p className="text-amber-600 text-xs">
                Total: {userCoins + 10} coins
              </p>
            </div>
            <div className="flex justify-center space-x-2 text-2xl">
              <span>🇳🇬</span>
              <span>🏆</span>
              <span>🇳🇬</span>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-2 px-6 py-2 rounded-full bg-[#064E3B] text-white text-sm font-bold"
            >
              Keep Going!
            </button>
          </div>
        </div>
      )}

      {/* Coins Toast */}
      {coinsEarnedToast && (
        <div className="fixed top-20 right-4 z-40 bg-amber-400 text-slate-900 px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce">
          +{coinsEarnedToast} 🪙 coins earned!
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
            Drop Homework Photo Here
          </h3>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#064E3B] text-white p-3 sm:p-4 shadow-sm flex items-center justify-between border-b border-[#0A5D46] shrink-0">
        <div className="flex items-center space-x-3">
          <MamaTitiAvatar
            size="md"
            isSpeaking={speakingMessageId !== null}
            showOnlineStatus={true}
          />
          <div>
            <h2 className="font-serif font-bold text-lg leading-tight">
              Mama Titi
            </h2>
            <p className="text-xs text-emerald-200">
              Nigerian AI Teacher {profile.classLevel}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-amber-400 text-slate-900 rounded-full px-2.5 py-1 text-[11px] font-bold">
            <span>🪙</span>
            <span>{userCoins}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#022C22] text-amber-300 text-[11px] font-semibold border border-amber-400/30">
            {profile.language === 'yo' ? 'Yoruba' : 'English'}
          </span>
          <button
            onClick={handleNewChat}
            className="px-2.5 py-1 rounded-full bg-red-900/40 text-red-300 text-[11px] font-semibold border border-red-400/30 hover:bg-red-800/50 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Snap Homework Bar */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 p-2.5 px-3.5 sm:px-4 shadow-sm flex items-center justify-between shrink-0 border-b border-amber-500">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-950 text-amber-300 rounded-xl">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif font-bold text-xs sm:text-sm leading-tight text-slate-950">
              Snap Your Homework
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-800 font-sans">
              Earn 5 coins per homework snap!
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-all flex items-center space-x-1"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>
          <button
            onClick={() => directFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all flex items-center space-x-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
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
                        <span className="text-[10px] bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          AI Teacher Voice
                        </span>
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
                      <StoryVisual text={msg.text} />
                    </div>
                  ) : (
                    <p className="text-sm font-sans leading-relaxed font-medium text-slate-900">
                      {msg.text}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-sans px-2">
                  {isMama ? 'Mama Titi · ' : 'You · '}
                  {msg.timestamp}
                </span>
              </div>
            </React.Fragment>
          );
        })}

        {/* Fun Loading */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <MamaTitiAvatar
              size="sm"
              isSpeaking={false}
              showOnlineStatus={false}
            />
            <div className="bg-white rounded-3xl rounded-tl-xs border-2 border-emerald-600/30 px-4 py-3 shadow-md max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex space-x-1">
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
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
        <div className="fixed bottom-[130px] sm:bottom-[135px] left-0 right-0 max-w-2xl mx-auto px-3 z-30">
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
                  <span>Cropped Question Ready</span>
                </span>
                <p className="text-[11px] text-emerald-300 font-medium">
                  Ready for Mama Titi
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setIsCropperOpen(true)}
                className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs transition-colors flex items-center space-x-1"
              >
                <Crop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
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
      <div className="fixed bottom-[66px] sm:bottom-[70px] left-0 right-0 max-w-2xl mx-auto px-3 pb-1 z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-full border-2 border-slate-300 shadow-2xl p-1.5 flex items-center space-x-2">
          <button
            onClick={() => directFileInputRef.current?.click()}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#064E3B] transition-all"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCameraOpen(true)}
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
              croppedImage
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
