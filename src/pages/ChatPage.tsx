import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Sparkles, Loader2, Crown, Lock, X, Upload, Crop, Image as ImageIcon, Eye } from 'lucide-react';
import { UserProfile, ChatMessage, UserSubscription } from '../types';
import { MamaTitiAvatar } from '../components/MamaTitiAvatar';
import { SyncedReadAlong } from '../components/SyncedReadAlong';
import { CameraUploadModal } from '../components/CameraUploadModal';
import { HomeworkCropModal } from '../components/HomeworkCropModal';
import { sendMessageToMamaTiti, getStoredChat, saveStoredChat } from '../services/apiClient';

interface ChatPageProps {
  profile: UserProfile;
  subscription?: UserSubscription;
  dailyMessagesCount: number;
  onIncrementDailyMessages: () => number;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenPricingModal: () => void;
  isGuest?: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  profile,
  subscription,
  dailyMessagesCount,
  onIncrementDailyMessages,
  onProfileUpdate,
  onOpenPricingModal,
  isGuest = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredChat());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Image & Cropping states
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  const plan = subscription?.plan || 'free';
  const isUnlimited = plan === 'basic' || plan === 'family';
  const remainingMessages = Math.max(0, 5 - dailyMessagesCount);
  const isLimitReached = !isUnlimited && dailyMessagesCount >= 5;

  useEffect(() => {
    saveStoredChat(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText?: string, imagePayload?: string) => {
    if (isLimitReached) {
      onOpenPricingModal();
      return;
    }

    const textToSend = overrideText || inputText;
    const imgToSend = imagePayload || croppedImage;

    if (!textToSend.trim() && !imgToSend) return;

    // Increment daily count for free/guest
    if (!isUnlimited) {
      onIncrementDailyMessages();
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim() || 'Mama Titi, please analyze this cropped homework photo for me!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePath: imgToSend || undefined
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setCroppedImage(null);
    setRawImageSrc(null);
    setIsLoading(true);

    try {
      const response = await sendMessageToMamaTiti({
        message: userMsg.text,
        profile,
        imageBase64: imgToSend || undefined,
        conversationHistory: newHistory.slice(-6)
      });

      const mamaMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        sender: 'mama_titi',
        text: response.reply,
        timestamp: response.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, mamaMsg]);

      // Award 10 gold stars for engaging with homework!
      onProfileUpdate({
        ...profile,
        stars: profile.stars + 10
      });
    } catch (err) {
      console.error('Error getting response from Mama Titi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Called when raw photo is selected from Camera modal or direct file picker or drag/drop
  const handleRawImageSelected = (base64: string) => {
    setRawImageSrc(base64);
    setIsCropperOpen(true);
  };

  const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCropComplete = (croppedBase64: string, originalBase64: string) => {
    setCroppedImage(croppedBase64);
    setRawImageSrc(originalBase64); // keep original so user can re-crop if needed
  };

  // Drag and drop handlers
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
      {/* Hidden file input for direct file upload */}
      <input
        type="file"
        ref={directFileInputRef}
        accept="image/*"
        onChange={handleDirectFileChange}
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#064E3B]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn border-4 border-dashed border-amber-400">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-amber-300">
            Drop Homework Photo Here 📸
          </h3>
          <p className="text-sm text-emerald-100 max-w-xs mt-1">
            Mama Titi will help you crop and analyze the question!
          </p>
        </div>
      )}

      {/* Top Banner: Mama Titi Header Info */}
      <div className="bg-[#064E3B] text-white p-3 sm:p-4 shadow-sm flex items-center justify-between border-b border-[#0A5D46] shrink-0">
        <div className="flex items-center space-x-3">
          <MamaTitiAvatar
            size="md"
            isSpeaking={speakingMessageId !== null}
            showOnlineStatus={true}
          />
          <div>
            <h2 className="font-serif font-bold text-lg leading-tight flex items-center space-x-1">
              <span>Mama Titi</span>
            </h2>
            <p className="text-xs text-emerald-200">
              Nigerian AI Teacher 🇳🇬 · JSS 3 to SS 3 Level ({profile.classLevel})
            </p>
          </div>
        </div>

        {/* Quick Language Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full bg-[#022C22] text-amber-300 text-[11px] font-jakarta font-semibold border border-amber-400/30">
            {profile.language === 'yo' ? 'Yoruba Mode' : 'English Mode'}
          </span>
        </div>
      </div>

      {/* Prominent Quick Action Bar: Snap Homework */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 p-2.5 px-3.5 sm:px-4 shadow-sm flex items-center justify-between shrink-0 border-b border-amber-500">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-950 text-amber-300 rounded-xl shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif font-bold text-xs sm:text-sm leading-tight text-slate-950">Snap Your Homework 📸</p>
            <p className="text-[10px] sm:text-[11px] text-slate-800 font-sans">Snap or upload photo for step-by-step help</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-amber-300 font-jakarta font-bold text-xs shadow-xs transition-all flex items-center space-x-1"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>
          <button
            onClick={() => directFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-jakarta font-bold text-xs shadow-xs transition-all flex items-center space-x-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Message Limits Bar for Free / Guest Users */}
      {!isUnlimited && (
        <div className="bg-emerald-950 text-emerald-200 px-3 py-1.5 text-xs font-jakarta flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {isGuest ? 'Guest Access' : 'Free Plan'}: <strong>{remainingMessages} of 5 messages remaining today</strong>
            </span>
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-44">
        {messages.map((msg, idx) => {
          const isMama = msg.sender === 'mama_titi';
          return (
            <React.Fragment key={msg.id}>
              <div className={`flex flex-col ${isMama ? 'items-start' : 'items-end'} space-y-1`}>
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 shadow-md transition-all ${
                    isMama
                      ? 'bg-white text-slate-900 rounded-tl-xs border-2 border-emerald-600/30'
                      : 'bg-[#FFE8DE] text-slate-900 rounded-tr-xs border border-[#FF6B35]/30'
                  }`}
                >
                  {/* Image attachment preview in chat message */}
                  {msg.imagePath && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-amber-300/60 max-h-56 bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src={msg.imagePath}
                        alt="Homework Question"
                        className="w-full max-h-56 object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  {isMama ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-emerald-100">
                        <span className="font-serif font-bold text-xs text-[#064E3B] flex items-center space-x-1">
                          <span>Mama Titi 🇳🇬</span>
                        </span>
                        <span className="text-[10px] bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-full font-jakarta font-bold">
                          AI Teacher Voice
                        </span>
                      </div>
                      <SyncedReadAlong
                        text={msg.text}
                        language={profile.language}
                        onSpeechStateChange={(speaking) =>
                          setSpeakingMessageId(speaking ? msg.id : null)
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-sans leading-relaxed font-medium text-slate-900">
                      {msg.text}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-400 font-sans px-2">
                  {isMama ? 'Mama Titi · ' : 'You · '}{msg.timestamp}
                </span>
              </div>
            </React.Fragment>
          );
        })}

        {/* Limit Reached Card when 5 daily messages reached */}
        {isLimitReached && (
          <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-400 text-center space-y-2 my-4 shadow-md animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Daily Message Limit Reached 🌟
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                You have used your 5 free daily messages with Mama Titi. Use the <strong>⋮ menu at the top right</strong> to upgrade anytime for unlimited access!
              </p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-jakarta italic p-2">
            <MamaTitiAvatar size="sm" isSpeaking={true} showOnlineStatus={false} />
            <div className="flex items-center space-x-1 text-[#064E3B] font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
              <span>Mama Titi is analyzing your homework question...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Cropped Homework Image Draft Card Preview before sending */}
      {croppedImage && (
        <div className="fixed bottom-[130px] sm:bottom-[135px] left-0 right-0 max-w-2xl mx-auto px-3 z-30">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 px-3.5 rounded-2xl border-2 border-amber-400 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-300 bg-black/40 shrink-0">
                <img
                  src={croppedImage}
                  alt="Cropped Homework Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-jakarta font-bold text-[10px] flex items-center space-x-1">
                    <Crop className="w-3 h-3 text-slate-950" />
                    <span>Cropped Question</span>
                  </span>
                  <span className="text-[11px] text-emerald-300 font-jakarta font-medium">
                    Ready for Mama Titi
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate font-sans">
                  Targeted question photo attached
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Button to Re-Open Cropper */}
              <button
                onClick={() => setIsCropperOpen(true)}
                className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-jakarta font-bold text-xs transition-colors flex items-center space-x-1"
                title="Edit crop / resize box"
              >
                <Crop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Crop</span>
              </button>

              {/* Button to Remove Image */}
              <button
                onClick={() => {
                  setCroppedImage(null);
                  setRawImageSrc(null);
                }}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Input Bar - Positioned cleanly ABOVE BottomNav (bottom-[68px]) */}
      <div className="fixed bottom-[66px] sm:bottom-[70px] left-0 right-0 max-w-2xl mx-auto px-3 pb-1 z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-full border-2 border-slate-300 shadow-2xl p-1.5 flex items-center space-x-2">
          
          {/* Upload File / Gallery button */}
          <button
            onClick={() => directFileInputRef.current?.click()}
            disabled={isLimitReached}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#064E3B] transition-all disabled:opacity-40"
            title="Upload homework photo file"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Camera button to snap homework photo */}
          <button
            onClick={() => setIsCameraOpen(true)}
            disabled={isLimitReached}
            className="p-2.5 rounded-full bg-[#FFE8DE] hover:bg-[#FFD0BE] text-[#FF6B35] font-bold transition-all disabled:opacity-40 flex items-center space-x-1"
            title="Snap photo with camera"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLimitReached}
            placeholder={
              isLimitReached
                ? "Daily limit reached. Use 3 dots top-right to upgrade!"
                : croppedImage
                ? "Ask Mama Titi a question about this photo..."
                : "Ask Mama Titi anything or snap homework..."
            }
            className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-slate-800 placeholder:text-slate-400 px-2 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!inputText.trim() && !croppedImage) || isLimitReached}
            className="p-3 rounded-full bg-[#FF6B35] hover:bg-[#E85523] disabled:opacity-40 text-white font-bold transition-all shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camera Modal Choice */}
      <CameraUploadModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onImageSelected={handleRawImageSelected}
      />

      {/* Homework Image Cropper & Preview Modal */}
      <HomeworkCropModal
        isOpen={isCropperOpen}
        initialImageSrc={rawImageSrc}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
