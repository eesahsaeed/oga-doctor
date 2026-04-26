import { useState, useRef, useEffect } from "react";
import { IconButton } from "@material-tailwind/react";
import { PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";

export function VideoIntro() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("playing", handlePlay);
    video.addEventListener("pause", handlePause);

    video.play().catch(() => {});

    return () => {
      video.removeEventListener("playing", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div className="px-4 py-8 md:py-12 bg-white">
      <div className="max-w-5xl mx-auto relative rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/images/ogaDoctor.png"
            aria-label="OgaDoctor intro video - Consult anytime, anywhere"
          >
            <source src="/videos/ogaDoctor.mp4" type="video/mp4" />
          </video>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <IconButton
              color="white"
              className="rounded-full p-6 shadow-lg pointer-events-auto hover:scale-105 transition"
              size="lg"
              aria-label="Play video"
            >
              <PlayIcon className="h-10 w-10" />
            </IconButton>
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-30">
          <IconButton
            color="white"
            variant="text"
            className="rounded-full bg-black/40 hover:bg-black/60 transition p-3"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-6 w-6" />
            ) : (
              <SpeakerWaveIcon className="h-6 w-6" />
            )}
          </IconButton>
        </div>

        <div className="absolute bottom-4 left-5 z-20 text-white">
          <p className="text-lg md:text-xl font-medium drop-shadow-md">
            Consult anytime, anywhere
          </p>
          <p className="text-sm opacity-90">OgaDoctor - Digital Health</p>
        </div>
      </div>
    </div>
  );
}

export default VideoIntro;
