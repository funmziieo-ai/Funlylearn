import React, { useState } from 'react';
import mamaTitiImg from '../assets/images/mama_titi_official_1784860280943.jpg';

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
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36'
  }[size];

  const fallbackTextSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }[size];

  return (
    <div
      className={'relative inline-block ' + className}
      onClick={onClick}
    >
      {/* Outer ring */}
      <div
        className={
          'rounded-full p-1 bg-gradient-to-tr from-[#064E3B] via-[#D97706] to-[#064E3B] shadow-md transition-transform duration-300 ' +
          (isSpeaking ? 'scale-105 ring-4 ring-[#FF6B35]/40 animate-pulse' : '')
        }
      >
        <div
          className={
            'relative overflow-hidden rounded-full bg-[#FFFBF5] border-2 border-amber-400 ' +
            sizeClasses
          }
        >
          {!imgError ? (
            <img
              src={mamaTitiImg}
              alt="Mama Titi AI Teacher"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#064E3B] to-[#022C22] flex items-center justify-center">
              <span className={fallbackTextSize}>👩🏾‍🏫</span>
            </div>
          )}
        </div>
      </div>

      {/* Nigerian flag badge */}
      <span className="absolute -top-1 -left-1 text-xs leading-none">
        🇳🇬
      </span>

      {/* Online indicator */}
      {showOnlineStatus && (
        <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
          <span className="h-2 w-2 rounded-full bg-white animate-ping opacity-75" />
        </span>
      )}

      {/* Speaking sound waves */}
      {isSpeaking && (
        <div className="absolute -top-1 -right-1 bg-[#FF6B35] text-white p-1 rounded-full shadow-lg flex items-center justify-center">
          <span className="flex space-x-0.5">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
};
