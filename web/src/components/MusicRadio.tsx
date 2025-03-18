// https://www.youtube.com/watch?v=lp74O7UwBIQ

import { useState, useEffect, useRef, type FC } from 'react';

export const MusicRadio: FC = () => {
    // Device detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Hide component on iOS
    if (isIOS) return null;

    // Audio context and source references
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const initializingRef = useRef<boolean>(false);

    // UI state
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [volume, setVolume] = useState<number>(1);
    const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState<boolean>(false);

    // Debug state
    const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'error' }>>([]);

    // Audio source and configuration
    const audioUrl = 'https://v3x.video/drop/fishing_village.mp3';
    const audioDurationMs = 30 * 60 * 1000; // 30 minutes in ms

    // Add these at the top of the component
    const [isAudioContextUnlocked, setIsAudioContextUnlocked] = useState<boolean>(false);
    const hasUnlockedRef = useRef<boolean>(false); // Add this to prevent multiple unlocks

    // Logging helper
    const addLog = (message: string, type: 'info' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-49), { time, message, type }]);
        console[type](message);
    };

    // Calculate the current position in the audio based on UTC time
    const calculateTimePosition = (): number => {
        return Date.now() % audioDurationMs;
    };

    // Add touch event handlers for iOS audio unlocking
    useEffect(() => {
        if (!isIOS) return;

        const unlockAudioContext = async (event: Event) => {
            // Prevent multiple unlocks
            if (hasUnlockedRef.current || isAudioContextUnlocked) {
                addLog('iOS: Unlock already attempted, skipping');
                return;
            }

            hasUnlockedRef.current = true;
            addLog(`iOS: Attempting to unlock audio via ${event.type}`);

            try {
                // Initialize audio context if not exists
                if (!audioContextRef.current) {
                    await initializeAudio();
                }

                const ctx = audioContextRef.current;
                if (!ctx) {
                    addLog('iOS: No audio context available', 'error');
                    return;
                }

                addLog(`iOS: Pre-unlock context state: ${ctx.state}`);

                // Create and play a short silent buffer
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);

                // Create a temporary gain node for the unlock sound
                const unlockGain = ctx.createGain();
                unlockGain.gain.value = 0.001; // Nearly silent
                source.connect(unlockGain);
                unlockGain.connect(ctx.destination);

                // Start the source and immediately resume the context
                source.start(0);
                await ctx.resume();

                addLog(`iOS: Post-unlock context state: ${ctx.state}`);

                // Verify the context is actually running
                if (ctx.state === 'running') {
                    setIsAudioContextUnlocked(true);
                    addLog('iOS: Audio context successfully unlocked');

                    // Clean up event listeners
                    events.forEach(event => {
                        document.body.removeEventListener(event, unlockAudioContext);
                    });

                    // Clean up the unlock sound
                    setTimeout(() => {
                        try {
                            source.disconnect();
                            unlockGain.disconnect();
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }, 100);
                } else {
                    addLog(`iOS: Context still not running after unlock attempt: ${ctx.state}`, 'error');
                }
            } catch (e) {
                addLog(`iOS: Failed to unlock audio context: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
                hasUnlockedRef.current = false; // Allow retry on failure
            }
        };

        // Add event listeners for both touchstart and touchend
        const events = ['touchstart', 'touchend'];
        events.forEach(event => {
            document.body.addEventListener(event, unlockAudioContext, false);
        });

        return () => {
            events.forEach(event => {
                document.body.removeEventListener(event, unlockAudioContext);
            });
        };
    }, [isIOS, isAudioContextUnlocked]);

    const initializeAudio = async () => {
        // Prevent multiple initialization attempts
        if (initializingRef.current || audioContextRef.current) {
            return;
        }

        initializingRef.current = true;

        try {
            addLog('Initializing audio context...');
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const context = new AudioContextClass({
                // Use a lower sampleRate for iOS
                sampleRate: isIOS ? 44100 : 48000,
                latencyHint: 'playback'
            });

            audioContextRef.current = context;
            addLog(`Audio context created, state: ${context.state}`);

            // Create gain node and initialize it with current volume state
            const gainNode = context.createGain();
            gainNode.gain.value = volume; // Initialize with current volume
            gainNode.connect(context.destination);
            gainNodeRef.current = gainNode;
            addLog(`Gain node created and connected with initial volume ${volume}`);

            // Load audio file
            addLog('Fetching audio file...');
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            addLog('Audio file fetched, decoding...');

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            audioBufferRef.current = audioBuffer;

            addLog(`Audio decoded successfully, duration: ${audioBuffer.duration.toFixed(2)}s`);
            setIsAudioReady(true);

            if (isIOS) {
                addLog('iOS: Audio context initialized, waiting for user interaction');
            }
        } catch (err) {
            const errorMsg = `Failed to initialize audio: ${err instanceof Error ? err.message : 'Unknown error'}`;
            addLog(errorMsg, 'error');
            setLoadingError(errorMsg);
        } finally {
            initializingRef.current = false;
        }
    };

    // Initialize audio on mount for non-iOS devices
    useEffect(() => {
        if (!isIOS) {
            initializeAudio();
        }

        // Only cleanup on component unmount
        return () => {
            if (audioContextRef.current?.state !== 'closed') {
                addLog('Cleaning up audio context on unmount');
                audioSourceRef.current?.stop();
                audioSourceRef.current = null;
                audioContextRef.current?.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    // Add volume control handler
    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);

        // Update gain node if it exists, regardless of mute state
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setValueAtTime(newVolume, audioContextRef.current?.currentTime || 0);
            addLog(`Volume preset to ${newVolume.toFixed(2)}`);
        }
    };

    // Modify the toggleAudio function
    const toggleAudio = async () => {
        try {
            if (isIOS && !isAudioContextUnlocked) {
                addLog('iOS: Audio context not unlocked yet - tap anywhere on the screen first', 'error');
                return;
            }

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                addLog('First interaction: initializing audio...');
                await initializeAudio();
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const ctx = audioContextRef.current;
            const buffer = audioBufferRef.current;
            const gain = gainNodeRef.current;

            if (!ctx || !buffer || !gain) {
                addLog('Audio resources not ready yet - please try again', 'error');
                return;
            }

            if (ctx.state === 'suspended') {
                addLog('Resuming suspended audio context...');
                await ctx.resume();
                await new Promise(resolve => setTimeout(resolve, 100));
                addLog(`Context resumed, state: ${ctx.state}`);
            }

            // Stop current playback if any
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
            }

            const newMutedState = !isMuted;
            addLog(`Toggling audio state to ${newMutedState ? 'muted' : 'unmuted'}`);

            if (newMutedState) {
                // Muting - for iOS, we need to use the gain node method
                if (gainNodeRef.current) {
                    const currentGain = gainNodeRef.current.gain.value;
                    addLog(`Current gain before mute: ${currentGain}`);

                    gainNodeRef.current.gain.cancelScheduledValues(ctx.currentTime);
                    gainNodeRef.current.gain.setValueAtTime(currentGain, ctx.currentTime);
                    gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime + 0.11);

                    // Verify the gain change
                    setTimeout(() => {
                        addLog(`Gain after mute: ${gainNodeRef.current?.gain.value}`);
                    }, 200);
                }
                setIsPlaying(false);
                addLog('Audio muted');
            } else {
                // Unmuting and playing
                const currentPositionMs = calculateTimePosition();
                const startOffsetSec = currentPositionMs / 1000;

                // Recheck context and gain node
                if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) {
                    addLog('Audio resources lost during playback', 'error');
                    return;
                }

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBufferRef.current;
                source.connect(gainNodeRef.current);
                source.loop = true;

                // For iOS, we need to schedule the gain change
                const startTime = ctx.currentTime;

                gainNodeRef.current.gain.cancelScheduledValues(startTime);
                gainNodeRef.current.gain.setValueAtTime(0.001, startTime);
                gainNodeRef.current.gain.exponentialRampToValueAtTime(volume, startTime + 0.1);

                // Start playback
                source.start(startTime, startOffsetSec);
                audioSourceRef.current = source;
                setIsPlaying(true);

                addLog(`Playback started at ${startOffsetSec.toFixed(2)}s, context: ${audioContextRef.current.state}, gain: ${gainNodeRef.current.gain.value}`);

                // Verify the gain change
                setTimeout(() => {
                    const currentGain = gainNodeRef.current?.gain.value;
                    addLog(`Gain 200ms after unmute: ${currentGain}`);
                }, 200);

                // Double check iOS audio state with more detail
                if (isIOS) {
                    setTimeout(() => {
                        const currentCtx = audioContextRef.current;
                        const currentGain = gainNodeRef.current?.gain.value;
                        if (currentCtx) {
                            addLog(`iOS: State check - Context: ${currentCtx.state}, Gain: ${currentGain}, Time: ${currentCtx.currentTime}`);
                            if (currentCtx.state !== 'running') {
                                addLog('iOS: Context not running after playback start, attempting resume...', 'error');
                                currentCtx.resume().catch(() => { });
                            }
                        }
                    }, 100);
                }

                // Verify playback state
                setTimeout(() => {
                    const currentCtx = audioContextRef.current;
                    const currentGain = gainNodeRef.current;
                    if (currentCtx && currentGain) {
                        addLog(`Playback check - Context: ${currentCtx.state}, Gain: ${currentGain.gain.value}, Playing: ${Boolean(audioSourceRef.current)}, iOS: ${isIOS}`);
                    }
                }, isIOS ? 500 : 100);
            }

            setIsMuted(newMutedState);
        } catch (error) {
            const errorMsg = `Audio error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            addLog(errorMsg, 'error');
            setLoadingError(errorMsg);
        }
    };

    return (
        <div className="card h-fit w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-primary">Fishing Village Radio</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-xs text-accent/70 hover:text-accent"
                    >
                        {showDebug ? 'Hide Debug' : 'Show Debug'}
                    </button>
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${isPlaying ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-accent text-sm font-medium">LIVE</span>
                    </div>
                </div>
            </div>

            <p className="text-secondary mb-2">
                {isIOS ? 'Tap Listen to start the radio' : 'Enjoy the tunes in sync with the party'}
            </p>

            {loadingError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                    <p className="text-red-500 text-sm">{loadingError}</p>
                </div>
            )}

            {showDebug && (
                <div className="mb-4 p-3 bg-tertiary rounded-lg text-xs">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Debug Info</h4>
                        <button
                            onClick={() => setLogs([])}
                            className="text-xs text-accent/70 hover:text-accent"
                        >
                            Clear Logs
                        </button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.type === 'error' ? 'text-red-500' : 'text-secondary'}`}>
                                <span className="opacity-50">[{log.time}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 space-y-1 border-t border-black/10 pt-2">
                        <div>Device: {isIOS ? 'iOS' : 'Other'}</div>
                        <div>Context State: {audioContextRef.current?.state || 'not initialized'}</div>
                        <div>Audio Ready: {isAudioReady ? 'yes' : 'no'}</div>
                        <div>Playing: {isPlaying ? 'yes' : 'no'}</div>
                        <div>Muted: {isMuted ? 'yes' : 'no'}</div>
                        <div>Current Position: {(calculateTimePosition() / 1000).toFixed(1)}s</div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <div className="h-full aspect-square bg-tertiary p-1 rounded-md size-16 flex items-center justify-center">
                    <div className={`h-full aspect-square relative ${isPlaying ? 'animate-zoom' : 'opacity-50'}`}>
                        <img src="/speaker.png" alt="Radio" className="w-full h-full object-contain" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm mt-2 text-secondary">
                            Status: {!isAudioReady ? (isIOS ? 'Tap Listen to start' : 'Tuning in...') : isPlaying ? 'Playing' : 'Live'}
                        </p>
                        <button
                            onClick={toggleAudio}
                            className="button flex items-center"
                            disabled={isIOS ? false : !isAudioReady}
                        >
                            {isMuted ? 'Listen' : 'Mute'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="flex-1 h-1 bg-tertiary rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
                            disabled={isMuted && isPlaying} // Only disable if currently playing and muted
                        />
                        <span className="text-xs text-secondary w-8 text-right">
                            {Math.round(volume * 100)}%
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};
