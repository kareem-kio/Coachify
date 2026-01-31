
import React, { useRef, useEffect } from 'react';

interface ScreenPreviewProps {
  stream: MediaStream | null;
  onFrame?: (base64: string) => void;
  isActive: boolean;
}

const ScreenPreview: React.FC<ScreenPreviewProps> = ({ stream, onFrame, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (isActive && stream && onFrame) {
      intervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          if (ctx && video.readyState >= 2) {
            canvas.width = video.videoWidth / 2; // Resize for optimization
            canvas.height = video.videoHeight / 2;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  onFrame(base64);
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', 0.6);
          }
        }
      }, 1000); // 1 frame per second is enough for coding coach context
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, stream, onFrame]);

  return (
    <div className="relative w-full aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${isActive ? 'opacity-100' : 'opacity-30'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
          Screen Share Inactive
        </div>
      )}
      {isActive && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE PREVIEW
        </div>
      )}
    </div>
  );
};

export default ScreenPreview;
