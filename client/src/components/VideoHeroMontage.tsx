import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoHeroMontageProps {
  videoUrl?: string;
  fallbackGradient?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  overlayOpacity?: number;
}

export default function VideoHeroMontage({
  videoUrl = "https://player.vimeo.com/progressive_redirect/playback/822886266/rendition/720p/file.mp4?loc=external&signature=1b15cc3fa1e7cf04c8f1e84a3f8a0d6c3c3b3c3c3c3c3c3c3c3c3c3c3c3c3c3c",
  fallbackGradient = true,
  autoPlay = true,
  showControls = false,
  overlayOpacity = 0.4
}: VideoHeroMontageProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      if (autoPlay) {
        video.play().catch((error) => {
          console.warn("Video autoplay prevented:", error);
          setIsPlaying(false);
        });
      }
    };

    const handleError = () => {
      setHasError(true);
      console.error("Video failed to load");
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [autoPlay]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (hasError && !fallbackGradient) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video Element */}
      {!hasError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loop
          muted={isMuted}
          playsInline
          preload="auto"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      )}

      {/* Fallback Gradient (shown during loading or on error) */}
      {(hasError || !isLoaded) && fallbackGradient && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/60 via-transparent to-indigo-50/60"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-50/40 to-transparent"></div>
          
          {/* Animated Gradient Orbs - Fallback */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-300/40 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-1/3 right-10 w-80 h-80 bg-gradient-to-br from-fuchsia-200/40 to-pink-300/40 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-rose-200/40 to-purple-200/40 rounded-full blur-3xl animate-float-slow"></div>
          </div>
        </div>
      )}

      {/* Overlay for Better Text Readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white/20"
        style={{ opacity: overlayOpacity }}
      />

      {/* Video Controls (Optional) */}
      {showControls && !hasError && isLoaded && (
        <div className="absolute bottom-8 right-8 flex gap-3 z-20">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-gray-900" />
            ) : (
              <Play className="w-5 h-5 text-gray-900" />
            )}
          </button>

          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-900" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-900" />
            )}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            <p className="text-sm text-violet-900 font-medium">Loading experience...</p>
          </div>
        </div>
      )}
    </div>
  );
}
