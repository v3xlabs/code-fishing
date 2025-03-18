// https://www.youtube.com/watch?v=lp74O7UwBIQ

import { useState, useEffect, useRef, type FC } from 'react';

export const MusicRadio: FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);

    // Audio source
    const audioUrl = 'https://v3x.video/drop/fishing_village.mp3';
    const audioDurationInSeconds = 30 * 60; // 30 minutes

    // Calculate how far into the audio we should be based on UTC time
    const calculateTimePosition = (): number => {
        const now = new Date();
        const totalSeconds = Math.floor(now.getTime() / 1000);
        return (totalSeconds % audioDurationInSeconds);
    };

    // Sync time position on load and periodically
    useEffect(() => {
        // Initial sync
        const syncAudio = () => {
            if (!audioRef.current) return;

            const syncPosition = calculateTimePosition();
            setCurrentTime(syncPosition);

            // If playing and out of sync by more than 2 seconds, adjust
            if (isPlaying) {
                const currentPlayerTime = audioRef.current.currentTime;
                const diff = Math.abs(currentPlayerTime - syncPosition);
                if (diff > 2) {
                    audioRef.current.currentTime = syncPosition;
                }
            }
        };

        // Set up periodic sync
        const timer = setInterval(syncAudio, 1000);

        return () => clearInterval(timer);
    }, [isPlaying]);

    // Handle initial setup and auto-play
    useEffect(() => {
        if (!audioRef.current) return;

        const syncPosition = calculateTimePosition();
        audioRef.current.currentTime = syncPosition;

        // Try to auto-play
        audioRef.current.play().catch(err => {
            console.error('Autoplay prevented:', err);
            setIsPlaying(false);
        });

        // Clean up on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Format seconds to mm:ss
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle audio playing event
    const handlePlaying = () => {
        setIsPlaying(true);
    };

    // Handle audio pause event
    const handlePause = () => {
        setIsPlaying(false);
    };

    // Handle audio ended event
    const handleEnded = () => {
        if (!audioRef.current) return;

        // If audio ends, restart at the current sync position
        const syncPosition = calculateTimePosition();
        audioRef.current.currentTime = syncPosition;
        audioRef.current.play().catch(console.error);
    };

    // Toggle mute (which also pauses behind the scenes)
    const toggleMute = () => {
        if (!audioRef.current) return;

        if (isMuted) {
            // If unmuting, sync to current time before playing
            const syncPosition = calculateTimePosition();
            audioRef.current.currentTime = syncPosition;
            audioRef.current.muted = false;
            audioRef.current.play().catch(console.error);
        } else {
            audioRef.current.pause();
            audioRef.current.muted = true;
        }

        setIsMuted(!isMuted);
    };

    return (
        <div className="card h-fit w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-primary">Fishing Village Radio</h1>
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                    <span className="text-accent text-sm font-medium">LIVE</span>
                </div>
            </div>

            <audio
                src={audioUrl}
                ref={audioRef}
                onPlay={handlePlaying}
                onPause={handlePause}
                onEnded={handleEnded}
                preload="auto"
                className="hidden"
            />

            <p className="text-secondary mb-2">Enjoy the tunes in sync with the party</p>

            <div className="flex items-center gap-2">
                <div className="h-full aspect-square bg-primary p-1 rounded-md size-16 flex items-center justify-center">
                    <div className="h-full aspect-square bg-tertiary rounded-full overflow-hidden animate-spin-slow">
                        <div className="w-1/2 bg-accent h-1 absolute top-1/2 -translate-y-1/2 left-1/2">
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mt-4 mb-2">
                        <p className="text-secondary text-sm">
                            {formatTime(currentTime)} / 30:00
                        </p>
                        <button
                            onClick={toggleMute}
                            className="button flex items-center"
                        >
                            {isMuted ? 'Listen' : 'Mute'}
                        </button>
                    </div>

                    <div className="relative w-full h-1 bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-accent"
                            style={{ width: `${(currentTime / audioDurationInSeconds) * 100}%` }}
                        ></div>
                    </div>

                    <p className="text-sm mt-2 text-secondary">
                        Status: {isMuted ? 'Muted' : isPlaying ? 'Playing' : 'Connecting...'}
                    </p>
                </div>
            </div>
        </div>
    );
};
