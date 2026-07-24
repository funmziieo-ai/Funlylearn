import React from 'react';

const mamaAvatarImage = '/assets/images/mama_titi_official.jpg';

interface MamaTitiAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  showOnlineStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MamaTitiAvatar: React.FC<MamaTitiAvatarProps> = ({
  size = 'md',
  isSpeaking = false,
  showOnlineStatus = true,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 border-2',
    md: 'w-14 h-14 border-3',
    lg: 'w-24 h-24 border-4',
    xl: 'w-36 h-36 border-4'
  }[size];

  return (
    <div className={`relative inline-block ${className}`} onClick={onClick}>
      {/* Outer ring: Circular green-and-gold ring motif */}
      <div
        className={`rounded-full p-1 bg-gradient-to-tr from-[#064E3B] via-[#D97706] to-[#064E3B] shadow-md transition-transform duration-300 ${
          isSpeaking ? 'scale-105 ring-4 ring-[#FF6B35]/40 animate-pulse' : ''
        }`}
      >
        <div className={`relative overflow-hidden rounded-full bg-[#FFFBF5] ${sizeClasses} border-[#F59E0B]`}>
          <img
            src={mamaAvatarImage}
            alt="Mama Titi AI Teacher"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Online indicator */}
      {showOnlineStatus && (
        <span
          className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"
          title="Mama Titi is online 24/7"
        >
          <span className="h-2 w-2 rounded-full bg-white animate-ping opacity-75" />
        </span>
      )}

      {/* Speaking Sound Waves Badge */}
      {isSpeaking && (
        <div className="absolute -top-1 -right-1 bg-[#FF6B35] text-white p-1 rounded-full shadow-lg flex items-center justify-center">
          <span className="flex space-x-0.5">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      )}
    </div>
  );
};
