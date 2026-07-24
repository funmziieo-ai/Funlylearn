import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { X, RotateCw, ZoomIn, Check, Crop, Upload, Camera, Sparkles, RefreshCw, Maximize2 } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';

interface HomeworkCropModalProps {
  isOpen: boolean;
  initialImageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string, originalBase64: string) => void;
}

export const HomeworkCropModal: React.FC<HomeworkCropModalProps> = ({
  isOpen,
  initialImageSrc,
  onClose,
  onCropComplete,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined); // undefined = free crop
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialImageSrc when prop changes
  React.useEffect(() => {
    setImageSrc(initialImageSrc);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, [initialImageSrc]);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = async () => {
    if (!imageSrc) return;
    try {
      setIsProcessing(true);
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        onCropComplete(croppedImage, imageSrc);
      } else {
        onCropComplete(imageSrc, imageSrc);
      }
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
      // Fallback to original image
      onCropComplete(imageSrc, imageSrc);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseFullImage = () => {
    if (imageSrc) {
      onCropComplete(imageSrc, imageSrc);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#064E3B] text-white p-3.5 sm:p-4 px-5 flex items-center justify-between border-b border-[#0A5D46] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-300">
                Preview & Crop Homework 📐
              </h3>
              <p className="text-[11px] text-emerald-200">
                Focus on the question for Mama Titi to analyze
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!imageSrc ? (
            /* Upload Dropzone if no image yet */
            <div className="space-y-4 text-center py-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-400/80 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-50 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#064E3B] text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-800 text-sm sm:text-base">
                    Select Homework Photo or Snap Camera
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Upload textbook pages, math equations, or handwritten notes.
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#FF6B35] text-white font-jakarta font-bold text-xs shadow-xs hover:bg-[#E85523] transition-colors">
                  Choose Photo
                </span>
              </div>
            </div>
          ) : (
            /* Cropper Area */
            <div className="space-y-4">
              {/* Cropper Box */}
              <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/80 shadow-inner">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={onCropChange}
                  onCropComplete={onCropCompleteCallback}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                />
              </div>

              {/* Helper Hint */}
              <div className="bg-amber-50 rounded-xl p-2.5 px-3 border border-amber-200 flex items-center space-x-2 text-xs font-jakarta text-slate-700">
                <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
                <span>
                  <strong>Tip:</strong> Pinch or drag slider to zoom. Crop tightly around the question!
                </span>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Zoom Control */}
                <div className="flex items-center space-x-2 bg-slate-100 p-2 px-3 rounded-xl">
                  <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-label="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-[#FF6B35] cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-600 w-8 text-right">
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                {/* Rotate & Aspect Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-semibold text-xs flex items-center justify-center space-x-1.5 border border-slate-200 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#064E3B]" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    onClick={() => setAspect(aspect === undefined ? 4 / 3 : undefined)}
                    className={`flex-1 py-2 px-3 rounded-xl font-jakarta font-semibold text-xs flex items-center justify-center space-x-1 border transition-colors ${
                      aspect !== undefined
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{aspect ? 'Box (4:3)' : 'Free Crop'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {imageSrc && (
          <div className="bg-slate-50 p-3.5 sm:p-4 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-jakarta font-semibold text-xs flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Photo</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleUseFullImage}
                className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-jakarta font-bold text-xs transition-all"
              >
                Full Photo
              </button>
              <button
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85523] text-white font-jakarta font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Cropping...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Done Cropping 🌟</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
