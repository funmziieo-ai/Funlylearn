import React, { useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';

interface CameraUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (base64: string) => void;
}

export const CameraUploadModal: React.FC<CameraUploadModalProps> = ({
  isOpen,
  onClose,
  onImageSelected
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onImageSelected(reader.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl border-2 border-amber-400/80 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-[#064E3B] text-white p-4 px-6 flex items-center justify-between border-b border-[#0A5D46]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-300">
                Upload Homework Photo 📸
              </h3>
              <p className="text-[11px] text-emerald-200">
                Snap or upload your question for Mama Titi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Camera Input (Environment mode) */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Gallery Input */}
          <input
            type="file"
            ref={galleryInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Snap Live Camera */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-400/60 hover:border-amber-400 text-slate-800 transition-all flex flex-col items-center justify-center text-center space-y-2 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-xl bg-[#064E3B] text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="font-serif font-bold text-xs text-slate-900">
                Snap Photo 📸
              </span>
              <span className="text-[10px] text-slate-500">
                Use camera to take picture
              </span>
            </button>

            {/* Choose from Device */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="p-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400/60 hover:border-emerald-500 text-slate-800 transition-all flex flex-col items-center justify-center text-center space-y-2 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-serif font-bold text-xs text-slate-900">
                Choose File 🖼️
              </span>
              <span className="text-[10px] text-slate-500">
                Select image from gallery
              </span>
            </button>
          </div>

          <div className="bg-amber-100/70 rounded-xl p-3 border border-amber-300 flex items-center space-x-2 text-xs font-jakarta text-slate-700">
            <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
            <span>
              Next, you can <strong>crop and zoom</strong> into the specific question box!
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

