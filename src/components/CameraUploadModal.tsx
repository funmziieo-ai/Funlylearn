import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Sparkles, RotateCcw, Check } from 'lucide-react';

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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const legacyCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 'closed' | 'menu' | 'live' — 'live' is the real webcam view, used
  // whenever getUserMedia is actually available (works on both laptops
  // and phones), instead of relying on the mobile-only capture="environment"
  // hint that desktop browsers silently ignore.
  const [cameraMode, setCameraMode] = useState<'menu' | 'live'>('menu');
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCameraMode('menu');
      setCapturedFrame(null);
      setCameraError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onImageSelected(reader.result as string);
          handleFullClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullClose = () => {
    stopStream();
    setCameraMode('menu');
    setCapturedFrame(null);
    setCameraError(null);
    onClose();
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // getUserMedia isn't available at all (very old browser) — fall
      // back to the legacy file-input approach, which at least still
      // works as a plain upload even if it can't show a live preview.
      setIsStartingCamera(false);
      legacyCameraInputRef.current?.click();
      return;
    }

    try {
      // Try the rear/environment camera first (best for phones snapping
      // homework). Laptops don't have this, so this attempt commonly
      // fails there — that's expected, we catch it below and retry.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
    } catch {
      try {
        // Fall back to whatever camera exists — this is the path that
        // actually makes laptops work, since they only have one
        // front-facing webcam and no "environment" option.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        streamRef.current = stream;
      } catch (err) {
        setIsStartingCamera(false);
        setCameraError(
          'Could not access your camera. Please check camera permissions for this site, or choose a file instead.'
        );
        return;
      }
    }

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play().catch(() => {});
    }

    setIsStartingCamera(false);
    setCameraMode('live');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedFrame(dataUrl);
    stopStream();
  };

  const retakePhoto = () => {
    setCapturedFrame(null);
    startLiveCamera();
  };

  const confirmCapturedPhoto = () => {
    if (capturedFrame) {
      onImageSelected(capturedFrame);
      handleFullClose();
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
            onClick={handleFullClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legacy fallback file input — only used if getUserMedia is unsupported */}
        <input
          type="file"
          ref={legacyCameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* MENU: choose Snap or Upload */}
        {cameraMode === 'menu' && !capturedFrame && (
          <div className="p-6 space-y-4">
            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {cameraError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startLiveCamera}
                disabled={isStartingCamera}
                className="p-5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-400/60 hover:border-amber-400 text-slate-800 transition-all flex flex-col items-center justify-center text-center space-y-2 group shadow-2xs disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-[#064E3B] text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-serif font-bold text-xs text-slate-900">
                  {isStartingCamera ? 'Starting Camera...' : 'Snap Photo 📸'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Opens your live camera
                </span>
              </button>

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
        )}

        {/* LIVE CAMERA VIEW */}
        {cameraMode === 'live' && !capturedFrame && (
          <div className="bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[60vh] object-contain bg-black"
            />
            <div className="p-4 flex items-center justify-center space-x-4 bg-slate-950">
              <button
                onClick={() => {
                  stopStream();
                  setCameraMode('menu');
                }}
                className="px-4 py-2 rounded-full bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-amber-400 shadow-lg active:scale-95 transition-transform"
                title="Capture photo"
              />
            </div>
          </div>
        )}

        {/* CAPTURED PREVIEW — confirm or retake */}
        {capturedFrame && (
          <div className="bg-black">
            <img
              src={capturedFrame}
              alt="Captured homework"
              className="w-full max-h-[60vh] object-contain bg-black"
            />
            <div className="p-4 flex items-center justify-center space-x-3 bg-slate-950">
              <button
                onClick={retakePhoto}
                className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                onClick={confirmCapturedPhoto}
                className="px-5 py-2.5 rounded-full bg-[#00A651] hover:bg-[#008f46] text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Use This Photo</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
