// https://www.youtube.com/watch?v=lp74O7UwBIQ

import { useState, useEffect, useRef, type FC } from 'react';

export const MusicRadio: FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const adjustingRef = useRef<boolean>(false);
    const syncAttemptsRef = useRef<number>(0);
    const lastSyncTimeRef = useRef<number>(Date.now());
    const deviceOffsetRef = useRef<number>(0); // Device-specific offset in ms
    const offsetHistoryRef = useRef<number[]>([]); // History of offsets for learning
    const lastForceSyncRef = useRef<number>(0); // Last time we forced sync
    const lastSpeedAdjustRef = useRef<number>(0); // Last time we adjusted playback speed
    const lastPropertyChangeRef = useRef<number>(0); // Last time we changed any audio property
    const isIOSRef = useRef<boolean>(false); // Track iOS separately - needs special handling
    const silentAudioTimeRef = useRef<number | null>(null); // Track if audio has gone silent
    const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'out-of-sync'>('syncing');
    const [deviceOffset, setDeviceOffset] = useState<number>(0); // For UI display
    const [recoveryAttempt, setRecoveryAttempt] = useState<number>(0); // Track audio recovery attempts
    
    // iOS penalty system - track consistent sync issues
    const [iosPenaltyOffset, setIosPenaltyOffset] = useState<number>(0); // Additional offset for iOS
    const [iosSyncMeasurements, setIosSyncMeasurements] = useState<number[]>([]); // Recent sync differences
    const [iosPenaltyApplied, setIosPenaltyApplied] = useState<boolean>(false); // Whether penalty was applied
    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false); // Toggle for debug information
    const [extremeLagMode, setExtremeLagMode] = useState<boolean>(false); // For handling extreme lag devices

    // Audio source
    const audioUrl = 'https://v3x.video/drop/fishing_village.mp3';
    const audioDurationInMilliseconds = 30 * 60 * 1000; // 30 minutes in ms

    // Sync configuration with much gentler approach for iOS
    const SYNC_INTERVAL = 250; // check sync more frequently (250ms)
    const SYNC_THRESHOLD_MS = 40; // More forgiving threshold
    const BUFFER_SIZE_MS = 100; // 100ms buffer size for synchronization
    const HARD_SYNC_THRESHOLD_MS = 150; // More forgiving hard sync threshold
    const MAX_SYNC_ATTEMPTS = 4; // More attempts before forcing sync (less aggressive)
    const SYNC_COOLDOWN_MS = 3000; // Shorter cooldown period (3 seconds)
    const MAX_OFFSET_HISTORY = 5; // Keep fewer samples (more responsive)
    const MAX_DEVICE_OFFSET = 300; // Allow for larger device offset
    const PERIODIC_FORCE_SYNC_INTERVAL = 60000; // Only force sync every 60 seconds (less aggressive)
    const LEARNING_RATE = 0.2; // Even gentler learning rate (20% adjustment)
    const SPEED_ADJUST_INTERVAL = 10000; // Adjust speed every 10 seconds for gradual catchup
    const MAX_PLAYBACK_RATE_MOBILE = 1.06; // Maximum playback rate for mobile (gentler)
    const MIN_PLAYBACK_RATE_MOBILE = 0.94; // Minimum playback rate for mobile (gentler)
    const MAX_PLAYBACK_RATE_DESKTOP = 1.1; // Maximum playback rate for desktop
    const MIN_PLAYBACK_RATE_DESKTOP = 0.9; // Minimum playback rate for desktop
    const PROPERTY_CHANGE_COOLDOWN = 2000; // Minimum time between audio property changes on iOS
    const SILENT_DETECTION_TIMEOUT = 5000; // How long we wait before considering audio silent
    
    // iOS-specific sync configuration - much more conservative
    const IOS_SYNC_INTERVAL = 1000; // Check sync less frequently on iOS (1 second)
    const IOS_SYNC_THRESHOLD_MS = 250; // Much wider threshold for iOS
    const IOS_HARD_SYNC_THRESHOLD_MS = 1000; // Only hard sync for large differences on iOS
    const IOS_PROPERTY_CHANGE_COOLDOWN = 5000; // Much longer cooldown between changes on iOS
    const IOS_SPEED_ADJUST_INTERVAL = 30000; // Only adjust speed every 30 seconds on iOS

    // iOS-specific configuration for penalties
    const IOS_MAX_PENALTY = 4000; // Maximum penalty in ms - increased for extreme lag cases
    const IOS_MIN_CONSISTENT_SAMPLES = 3; // How many samples to determine consistency
    const IOS_PENALTY_LEARN_RATE = 0.3; // How aggressively to adapt
    const IOS_MEASUREMENT_MAX_SIZE = 15; // How many measurements to keep (increased for better data)
    const IOS_PENALTY_THRESHOLD = 100; // Minimum difference to consider for penalty
    const IOS_EXTREME_LAG_THRESHOLD = 2500; // When to consider lag too extreme for regular handling
    const EXTREME_LAG_MODE_THRESHOLD = 1200; // When to consider device in extreme lag mode
    const FUTURE_THRESHOLD = 500; // Allow being up to 500ms ahead without taking action

    // Detect mobile devices on mount
    useEffect(() => {
        // Detect iOS specifically - needs special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        isIOSRef.current = isIOS;
        
        const mobileCheck = isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        
        console.log(`Device detection: ${isIOS ? 'iOS' : mobileCheck ? 'Mobile' : 'Desktop'}`);
        
        // Load device offset and iOS penalty from localStorage
        try {
            // Load device offset
            const savedOffset = localStorage.getItem('musicRadioDeviceOffset');
            if (savedOffset) {
                const parsedOffset = parseInt(savedOffset, 10);
                if (!isNaN(parsedOffset) && Math.abs(parsedOffset) <= MAX_DEVICE_OFFSET) {
                    deviceOffsetRef.current = parsedOffset;
                    setDeviceOffset(parsedOffset);
                    console.log(`Loaded device offset: ${parsedOffset}ms`);
                }
            }
            
            // Load iOS penalty if on iOS
            if (isIOS) {
                const savedPenalty = localStorage.getItem('musicRadioIOSPenalty');
                if (savedPenalty) {
                    const parsedPenalty = parseFloat(savedPenalty);
                    if (!isNaN(parsedPenalty) && Math.abs(parsedPenalty) <= IOS_MAX_PENALTY) {
                        setIosPenaltyOffset(parsedPenalty);
                        console.log(`Loaded iOS penalty offset: ${parsedPenalty.toFixed(0)}ms`);
                    }
                }
            }
        } catch (e) {
            console.error('Error loading offsets', e);
        }
    }, []);

    // Calculate the exact time position based on UTC time mod 30 minutes with millisecond precision
    // Align to 100ms boundaries for consistent buffer synchronization
    const calculateTimePosition = (): number => {
        const now = Date.now();
        const rawPosition = now % audioDurationInMilliseconds;
        // Align to 100ms boundaries to ensure consistent buffer boundaries
        return Math.floor(rawPosition / BUFFER_SIZE_MS) * BUFFER_SIZE_MS;
    };

    // Get the target position with device offset applied
    const getTargetPositionWithOffset = (): number => {
        // Calculate time and apply device offset + iOS penalty if applicable
        const baseTimePosition = calculateTimePosition();
        return baseTimePosition + deviceOffsetRef.current + (isIOSRef.current ? iosPenaltyOffset : 0);
    };

    // iOS-specific audio modification throttling to prevent audio interruption
    const canModifyAudioProperty = (): boolean => {
        if (!isIOSRef.current) return true;
        
        const now = Date.now();
        const timeSinceLastChange = now - lastPropertyChangeRef.current;
        
        // Only allow property changes after cooldown period on iOS
        return timeSinceLastChange > (isIOSRef.current ? IOS_PROPERTY_CHANGE_COOLDOWN : PROPERTY_CHANGE_COOLDOWN);
    };

    // Track audio property changes on iOS
    const trackPropertyChange = (): void => {
        if (isIOSRef.current) {
            lastPropertyChangeRef.current = Date.now();
        }
    };

    // Learn and adapt the device offset based on sync history - gentler learning
    const updateDeviceOffset = (currentDiff: number): void => {
        // Don't update if the difference is too large (likely a temporary issue)
        if (Math.abs(currentDiff) > 1000) {
            return;
        }
        
        // Add the current difference to history
        offsetHistoryRef.current.push(currentDiff);
        
        // Keep only recent history
        if (offsetHistoryRef.current.length > MAX_OFFSET_HISTORY) {
            offsetHistoryRef.current.shift();
        }
        
        // Only update if we have enough samples
        if (offsetHistoryRef.current.length >= 3) {
            // Calculate median to avoid outliers
            const sortedOffsets = [...offsetHistoryRef.current].sort((a, b) => a - b);
            const midIndex = Math.floor(sortedOffsets.length / 2);
            const medianDiff = sortedOffsets[midIndex];
            
            // Gentler offset update - less aggressive
            const newOffset = deviceOffsetRef.current + (medianDiff * LEARNING_RATE);
            
            // Clamp the offset to reasonable limits
            const clampedOffset = Math.max(-MAX_DEVICE_OFFSET, Math.min(MAX_DEVICE_OFFSET, newOffset));
            
            // Apply the new offset if the change is significant
            if (Math.abs(clampedOffset - deviceOffsetRef.current) > 5) {
                deviceOffsetRef.current = clampedOffset;
                setDeviceOffset(Math.round(clampedOffset));
                
                // Save to localStorage for persistence
                try {
                    localStorage.setItem('musicRadioDeviceOffset', Math.round(clampedOffset).toString());
                } catch (e) {
                    console.error('Error saving device offset', e);
                }
                
                console.log(`Updated device offset: ${Math.round(clampedOffset)}ms`);
            }
        }
    };

    // Convert milliseconds to seconds for audio API
    const msToSeconds = (ms: number): number => ms / 1000;
    
    // Convert seconds to milliseconds
    const secondsToMs = (seconds: number): number => seconds * 1000;

    // Set a safe playback rate, taking into account device limitations
    const setPlaybackRate = (audio: HTMLAudioElement, rate: number): void => {
        // For iOS, enforce additional cooldown between property changes
        if (isIOSRef.current && !canModifyAudioProperty()) {
            console.log('iOS: Skipping playback rate change due to recent property change');
            return;
        }
        
        // Clamp the rate based on device type
        let safeRate;
        if (isMobile) {
            safeRate = Math.max(MIN_PLAYBACK_RATE_MOBILE, Math.min(MAX_PLAYBACK_RATE_MOBILE, rate));
            
            // iOS has even narrower playbackRate support in some versions
            if (isIOSRef.current) {
                safeRate = Math.max(0.98, Math.min(1.02, rate));
            }
        } else {
            safeRate = Math.max(MIN_PLAYBACK_RATE_DESKTOP, Math.min(MAX_PLAYBACK_RATE_DESKTOP, rate));
        }
        
        // Only update if significantly different, to avoid constant tiny adjustments
        if (Math.abs(audio.playbackRate - safeRate) > (isIOSRef.current ? 0.01 : 0.005)) {
            audio.playbackRate = safeRate;
            trackPropertyChange();
            
            console.log(`Set playback rate: ${safeRate.toFixed(3)}`);
        }
    };
    
    // Calculate the playback rate needed to catch up over the next 10 seconds
    const calculateCatchupRate = (diffMs: number): number => {
        // How many ms we need to catch up over 10 seconds
        // diffMs > 0 means we're behind, need to speed up
        // diffMs < 0 means we're ahead, need to slow down
        
        // 10 seconds = 10000ms. If we're behind by diffMs,
        // we need to cover an extra diffMs over 10000ms
        const targetPlayTime = 10000;
        
        // If diffMs is positive, we need to play faster to catch up
        // If diffMs is negative, we need to play slower to fall back
        const adjustedTime = targetPlayTime + diffMs;
        
        // Rate = original time / adjusted time
        // e.g., if we need to cover 10500ms in 10000ms, rate = 10500/10000 = 1.05
        let rate = targetPlayTime / adjustedTime;
        
        // Only make meaningful adjustments
        if (Math.abs(rate - 1.0) < 0.01) {
            rate = 1.0;
        }
        
        return rate;
    };

    // Set audio time safely, especially for iOS
    const setAudioTime = (audio: HTMLAudioElement, positionMs: number): void => {
        // For iOS, enforce additional cooldown between property changes
        if (isIOSRef.current && !canModifyAudioProperty()) {
            console.log('iOS: Skipping time change due to recent property change');
            return;
        }
        
        const seconds = msToSeconds(positionMs);
        audio.currentTime = seconds;
        trackPropertyChange();
        
        console.log(`Set current time: ${seconds.toFixed(3)}s (${positionMs}ms)`);
    };

    // Check if audio might have gone silent but still reporting as playing
    const checkForSilentAudio = (): void => {
        if (!audioRef.current || !isPlaying || isMuted) return;

        const now = Date.now();
        const currentTimeS = audioRef.current.currentTime;
        
        // If we already have a reference time, check if it has changed
        if (silentAudioTimeRef.current !== null) {
            const timeDiff = Math.abs(currentTimeS - silentAudioTimeRef.current);
            const timeElapsed = now - lastPropertyChangeRef.current;
            
            // If the audio time hasn't changed much despite significant time passing
            if (timeDiff < 0.1 && timeElapsed > SILENT_DETECTION_TIMEOUT) {
                console.warn('Detected silent audio playback (time not advancing). Attempting recovery.');
                attemptAudioRecovery();
                return;
            }
        }
        
        // Update reference time
        silentAudioTimeRef.current = currentTimeS;
    };

    // Attempt to recover from silent audio (a common iOS Safari issue)
    const attemptAudioRecovery = async (): Promise<void> => {
        if (!audioRef.current) return;
        
        // Increment recovery counter
        setRecoveryAttempt(prev => prev + 1);
        console.log(`Audio recovery attempt #${recoveryAttempt + 1}`);
        
        // Store current position
        const targetPositionMs = getTargetPositionWithOffset();
        
        try {
            // On iOS, we need to pause and play again to fix silent audio
            audioRef.current.pause();
            
            // Short delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Reset time - needed for iOS
            setAudioTime(audioRef.current, targetPositionMs);
            
            // Another delay before playing
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Resume playback
            await audioRef.current.play();
            console.log('Audio recovery: Successfully restarted playback');
            
            // Reset silent audio detection
            silentAudioTimeRef.current = null;
            lastPropertyChangeRef.current = Date.now();
        } catch (err) {
            console.error('Audio recovery failed:', err);
        }
    };
    
    // Force sync - much gentler on mobile and iOS
    const forceSync = (isPeriodicSync = false): void => {
        if (!audioRef.current || !isPlaying || isMuted) return;

        const now = Date.now();
        lastForceSyncRef.current = now;
        
        const targetPositionMs = getTargetPositionWithOffset();
        const currentPositionMs = secondsToMs(audioRef.current.currentTime);
        const diffMs = targetPositionMs - currentPositionMs;
        const absDiffMs = Math.abs(diffMs);

        // Special case for iOS - avoid time changes completely if possible
        if (isIOSRef.current) {
            // Use asymmetric threshold - only force for large positive diffs (behind)
            // or extremely large negative diffs (ahead)
            if (diffMs > 1000 || diffMs < -1500) {
                console.log(`iOS large sync: current=${currentPositionMs.toFixed(0)}ms, target=${targetPositionMs.toFixed(0)}ms, diff=${diffMs.toFixed(0)}ms`);
                
                // For large diffs on iOS, we do need to adjust the time
                if (canModifyAudioProperty()) {
                    // Since we're doing a time change, don't do a rate change immediately after
                    setAudioTime(audioRef.current, targetPositionMs);
                }
            } else {
                // For smaller differences, only use rate adjustment
                const catchupRate = calculateCatchupRate(diffMs);
                
                // Tighter bounds for iOS
                const iosRate = Math.max(0.97, Math.min(1.03, catchupRate));
                
                console.log(`iOS sync: avoiding time change, using playbackRate ${iosRate.toFixed(3)} to catch up ${diffMs.toFixed(0)}ms over 10s`);
                
                if (canModifyAudioProperty()) {
                    setPlaybackRate(audioRef.current, iosRate);
                }
            }
            return;
        }
        
        // For mobile (non-iOS), we prefer speed adjustments to hard position changes when possible
        if (isMobile && absDiffMs < 500) {
            // For smaller differences, just adjust speed and don't mess with currentTime
            if (absDiffMs < 200) {
                const catchupRate = calculateCatchupRate(diffMs);
                setPlaybackRate(audioRef.current, catchupRate);
                
                console.log(`Mobile gentle sync: avoiding time change, using playbackRate ${catchupRate.toFixed(3)} to catch up ${diffMs.toFixed(0)}ms over 10s`);
                return;
            }
            
            // For medium differences on mobile, make a softer position adjustment
            // and follow with a gentle speed adjustment
            console.log(`Mobile adjusted sync: current=${currentPositionMs.toFixed(0)}ms, target=${targetPositionMs.toFixed(0)}ms, diff=${diffMs.toFixed(0)}ms`);
            
            // Apply position change
            setAudioTime(audioRef.current, targetPositionMs);
            
            // Wait before changing playback rate to avoid audio glitches
            setTimeout(() => {
                if (audioRef.current) {
                    // Apply very gentle playback rate
                    setPlaybackRate(audioRef.current, diffMs > 0 ? 1.02 : 0.98);
                }
            }, 500);
            
            return;
        }
        
        // Non-mobile or large differences get more traditional handling
        console.log(`${isPeriodicSync ? 'PERIODIC' : 'FORCE'} SYNC: setting to ${targetPositionMs.toFixed(0)}ms (diff=${diffMs.toFixed(0)}ms, device offset: ${deviceOffsetRef.current.toFixed(0)}ms)`);
        
        // Apply the position
        setAudioTime(audioRef.current, targetPositionMs);
        
        // Wait before changing playback rate
        setTimeout(() => {
            if (audioRef.current) {
                // Set a gentle playback rate adjustment to help stabilize
                const gentleRate = diffMs > 0 ? 1.03 : 0.97;
                setPlaybackRate(audioRef.current, gentleRate);
                
                // Reset playback rate after a delay
                setTimeout(() => {
                    if (audioRef.current) {
                        setPlaybackRate(audioRef.current, 1.0);
                    }
                }, 2000);
            }
        }, 500);
        
        // Reset sync attempts after force sync
        syncAttemptsRef.current = 0;
        lastSyncTimeRef.current = now;
    };

    // Update performSync function with gentler approach for mobile/iOS
    const performSync = (): void => {
        if (!audioRef.current || !isPlaying || isMuted) return;

        // If already adjusting, don't apply a new adjustment
        if (adjustingRef.current) return;

        const now = Date.now();
        const targetPositionMs = getTargetPositionWithOffset();
        const currentPositionMs = secondsToMs(audioRef.current.currentTime);
        const diffMs = targetPositionMs - currentPositionMs;
        const absDiffMs = Math.abs(diffMs);
        
        // Check for silent audio (especially on iOS)
        checkForSilentAudio();
        
        // Always update iOS penalty system with measurements, even if we don't act on them
        if (isIOSRef.current && isPlaying && !isMuted) {
            // Always collect measurements regardless of sync state
            updateIOSPenalty(diffMs);
        }
        
        // For iOS, focus mostly on playback rate adjustments, avoid time changes
        if (isIOSRef.current) {
            // Asymmetric sync status - be more lenient when we're ahead
            // diffMs > 0 means we're behind, diffMs < 0 means we're ahead
            if ((diffMs > 0 && diffMs <= IOS_SYNC_THRESHOLD_MS * 2) || 
                (diffMs < 0 && diffMs >= -500)) { // Much more lenient when ahead
                setSyncStatus('synced');
            } else if ((diffMs > 0 && diffMs <= IOS_HARD_SYNC_THRESHOLD_MS * 1.5) || 
                      (diffMs < 0 && diffMs >= -1000)) { // More lenient for syncing when ahead
                setSyncStatus('syncing');
            } else {
                setSyncStatus('out-of-sync');
            }
            
            // Only do extreme adjustments for very large differences
            if (absDiffMs > IOS_EXTREME_LAG_THRESHOLD) {
                if (now - lastForceSyncRef.current > PERIODIC_FORCE_SYNC_INTERVAL) {
                    console.log(`iOS extreme lag detected (${absDiffMs.toFixed(0)}ms), performing emergency sync`);
                    forceSync(true);
                }
                return;
            }
            
            // Periodic speed adjustment every 30 seconds for iOS (less frequent)
            if (now - lastSpeedAdjustRef.current > IOS_SPEED_ADJUST_INTERVAL) {
                // Time to adjust speed to catch up over the next 30 seconds
                lastSpeedAdjustRef.current = now;
                
                // Only bother with playback rate changes if significantly out of sync
                if (absDiffMs > IOS_SYNC_THRESHOLD_MS * 2 && absDiffMs < 1500) {
                    const catchupRate = calculateCatchupRate(diffMs);
                    // Very tight bounds for iOS
                    const iosRate = Math.max(0.98, Math.min(1.02, catchupRate));
                    
                    console.log(`iOS 30s catchup: setting rate to ${iosRate.toFixed(3)} to catch up ${diffMs.toFixed(0)}ms`);
                    setPlaybackRate(audioRef.current, iosRate);
                } else if (audioRef.current.playbackRate !== 1.0) {
                    // Reset to normal if we're close enough
                    setPlaybackRate(audioRef.current, 1.0);
                }
            }
            
            // For iOS, we're done - avoid any more audio property changes
            return;
        }
        
        // Non-iOS devices continue with normal sync logic
        
        // Periodic speed adjustment every 10 seconds
        if (now - lastSpeedAdjustRef.current > SPEED_ADJUST_INTERVAL) {
            // Time to adjust speed to catch up over the next 10 seconds
            lastSpeedAdjustRef.current = now;
            
            if (absDiffMs > SYNC_THRESHOLD_MS && absDiffMs < 500) {
                const catchupRate = calculateCatchupRate(diffMs);
                
                console.log(`10s catchup: setting rate to ${catchupRate.toFixed(3)} to catch up ${diffMs.toFixed(0)}ms`);
                setPlaybackRate(audioRef.current, catchupRate);
            } else if (audioRef.current.playbackRate !== 1.0) {
                // Reset to normal if we're close enough
                setPlaybackRate(audioRef.current, 1.0);
            }
        }
        
        // Periodic forced sync regardless of state - but less frequent
        if (now - lastForceSyncRef.current > PERIODIC_FORCE_SYNC_INTERVAL) {
            console.log('Performing periodic sync check');
            forceSync(true); // This is a periodic sync
            return;
        }

        // Learn from this sync attempt - update the device offset with gentler approach
        if (absDiffMs > SYNC_THRESHOLD_MS && absDiffMs < 500) {
            updateDeviceOffset(diffMs);
        }

        // Update sync status for UI feedback - asymmetric checks
        if ((diffMs > 0 && diffMs <= SYNC_THRESHOLD_MS) || 
            (diffMs < 0 && diffMs >= -500)) { // More lenient when ahead
            setSyncStatus('synced');
            // Reset sync attempts when in sync
            syncAttemptsRef.current = 0;
        } else if ((diffMs > 0 && diffMs <= HARD_SYNC_THRESHOLD_MS) || 
                  (diffMs < 0 && diffMs >= -750)) { // More lenient when ahead
            setSyncStatus('syncing');
        } else {
            // Only consider truly out of sync when very far behind or extremely far ahead
            setSyncStatus('out-of-sync');
            
            // Only increment sync attempts when behind by a lot or ahead by an extreme amount
            if (diffMs > HARD_SYNC_THRESHOLD_MS || diffMs < -1000) {
                syncAttemptsRef.current++;
                
                // If we've been trying to sync for too long, force a sync, but only
                // if we're behind or extremely ahead (>1000ms)
                if (syncAttemptsRef.current >= MAX_SYNC_ATTEMPTS && 
                    (now - lastSyncTimeRef.current) > SYNC_COOLDOWN_MS) {
                    forceSync(false); // Recovery sync
                    return;
                }
            }
        }

        // For hard syncs, use a much gentler approach on mobile
        if (absDiffMs > HARD_SYNC_THRESHOLD_MS && !isMobile) {
            // Desktop can handle more aggressive adjustments
            console.log(`Desktop hard sync: current=${currentPositionMs.toFixed(0)}ms, target=${targetPositionMs.toFixed(0)}ms, diff=${diffMs.toFixed(0)}ms`);
            
            // Small positive offset to account for processing time
            setAudioTime(audioRef.current, targetPositionMs + 20);
            
            // Apply a moderate rate adjustment to stabilize
            setTimeout(() => {
                if (audioRef.current) {
                    setPlaybackRate(audioRef.current, diffMs > 0 ? 1.05 : 0.95);
                    
                    setTimeout(() => {
                        if (audioRef.current) {
                            setPlaybackRate(audioRef.current, 1.0);
                        }
                    }, 1000);
                }
            }, 500);
        }
        // For smaller differences or mobile, we now rely on the 10s speed adjustment cycle
    };

    // More frequent sync checks for synchronization
    useEffect(() => {
        const timer = setInterval(() => {
            if (audioRef.current && isPlaying && !isMuted) {
                const positionMs = calculateTimePosition();
                setCurrentTimeMs(positionMs);
                performSync();
            }
        }, isIOSRef.current ? IOS_SYNC_INTERVAL : SYNC_INTERVAL);
        return () => clearInterval(timer);
    }, [isPlaying, isMuted]);

    // Add requestAnimationFrame-based sync for smoother UI updates on capable devices
    useEffect(() => {
        let animFrameId: number;
        let lastFrameTime = 0;
        const FRAME_INTERVAL = 1000; // Check once per second in animation frame

        const checkSyncOnFrame = (timestamp: number) => {
            if (!audioRef.current || !isPlaying || isMuted) {
                animFrameId = requestAnimationFrame(checkSyncOnFrame);
                return;
            }

            // Only run the sync check periodically within the animation frame
            if (timestamp - lastFrameTime > FRAME_INTERVAL) {
                // Only update the UI, not perform sync (which happens on the interval)
                const positionMs = calculateTimePosition();
                setCurrentTimeMs(positionMs);
                lastFrameTime = timestamp;
            }

            animFrameId = requestAnimationFrame(checkSyncOnFrame);
        };

        animFrameId = requestAnimationFrame(checkSyncOnFrame);
        return () => {
            cancelAnimationFrame(animFrameId);
        };
    }, [isPlaying, isMuted]);

    // Pre-buffer and setup before playing - extra careful approach for iOS
    const prepareAndPlay = async () => {
        if (!audioRef.current) return;
        
        try {
            // First, set to correct position before attempting to play
            const initialPosition = getTargetPositionWithOffset();
            
            // On iOS, apply additional penalty offset when starting playback
            // This helps us get ahead of known sync issues
            let startPosition = initialPosition;
            if (isIOSRef.current && Math.abs(iosPenaltyOffset) > 0) {
                // Additional buffer for extreme lag cases
                if (extremeLagMode && iosPenaltyOffset > 1000) {
                    // For extreme lag, add a small additional buffer to help catch up
                    startPosition += 200;
                    console.log(`Extreme lag mode: added 200ms additional buffer`);
                }
                
                // Mark that we've applied the penalty, so we don't keep increasing it
                setIosPenaltyApplied(true);
                // Don't reset measurements anymore - keep the history
                console.log(`Applying iOS penalty offset ${iosPenaltyOffset.toFixed(0)}ms during playback start`);
            }
            
            setAudioTime(audioRef.current, startPosition);
            
            // Special iOS handling
            if (isIOSRef.current) {
                console.log("iOS playback preparation - using simplified approach");
                
                // Just try to play directly without further modifications
                await audioRef.current.play();
                
                // Set state
                setIsPlaying(true);
                lastForceSyncRef.current = Date.now();
                lastSpeedAdjustRef.current = Date.now();
                silentAudioTimeRef.current = null;
                
                console.log('iOS audio started successfully');
                return;
            }
            
            // Non-iOS preparation
            
            // Small delay to allow buffering at that position
            const bufferDelay = 300;
            await new Promise(resolve => setTimeout(resolve, bufferDelay));
            
            // Now try to play
            await audioRef.current.play();
            
            // After successful play, set the position again to ensure sync
            const syncPosition = getTargetPositionWithOffset() + 20; // Smaller buffer
            setAudioTime(audioRef.current, syncPosition);
            
            // Set state first before messing with playback rate
            setIsPlaying(true);
            lastForceSyncRef.current = Date.now();
            lastSpeedAdjustRef.current = Date.now();
            silentAudioTimeRef.current = null;
            
            // Set playback rate slightly slower initially to help catch up
            setTimeout(() => {
                if (audioRef.current) {
                    setPlaybackRate(audioRef.current, 0.98);
                    
                    // After another small delay, normalize playback rate
                    setTimeout(() => {
                        if (audioRef.current) {
                            setPlaybackRate(audioRef.current, 1.0);
                        }
                    }, 300);
                }
            }, 300);
            
        } catch (err) {
            console.error('Play prevented:', err);
            setIsPlaying(false);
        }
    };

    // Initial setup and attempt to auto-play
    useEffect(() => {
        if (!audioRef.current) return;
        
        // Don't try to auto-play on mobile devices
        if (!isMobile) {
            prepareAndPlay().catch(err => {
                console.error('Auto-play setup failed:', err);
                setIsPlaying(false);
            });
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isMobile]);

    // Format time for display in mm:ss format
    const formatTime = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Event handlers for audio events
    const handlePlaying = () => {
        setIsPlaying(true);
        
        // Special handling for iOS
        if (!isIOSRef.current && audioRef.current) {
            // Only adjust position on non-iOS
            const syncPositionMs = getTargetPositionWithOffset() + 20; // Smaller buffer
            setAudioTime(audioRef.current, syncPositionMs);
            console.log(`Play sync: set to ${syncPositionMs.toFixed(0)}ms with device offset ${deviceOffsetRef.current.toFixed(0)}ms`);
        }
        
        lastForceSyncRef.current = Date.now();
        lastSpeedAdjustRef.current = Date.now();
        silentAudioTimeRef.current = null;
    };

    const handlePause = () => {
        setIsPlaying(false);
    };

    const handleEnded = () => {
        if (!audioRef.current) return;
        const syncPositionMs = getTargetPositionWithOffset() + 20; // Smaller buffer
        setAudioTime(audioRef.current, syncPositionMs);
        audioRef.current.play().catch(console.error);
    };

    // Handle audio metadata loaded - sync timestamp once audio is ready
    const handleMetadataLoaded = () => {
        setIsAudioReady(true);
        if (audioRef.current) {
            const syncPositionMs = getTargetPositionWithOffset();
            setAudioTime(audioRef.current, syncPositionMs);
            console.log(`Initial sync: set to ${syncPositionMs.toFixed(0)}ms with device offset ${deviceOffsetRef.current.toFixed(0)}ms`);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        if (isMuted) {
            // Pre-buffer and play with enhanced sync
            audioRef.current.muted = false;
            prepareAndPlay().catch(err => {
                console.error('Play after unmute failed:', err);
            });
        } else {
            audioRef.current.pause();
            audioRef.current.muted = true;
        }
        setIsMuted(!isMuted);
    };

    // Reset audio (for recovery)
    const resetAudio = () => {
        if (!audioRef.current) return;
        
        // Force a full reload by toggling mute off then on
        audioRef.current.pause();
        audioRef.current.muted = true;
        setIsMuted(true);
        
        // Reset counters
        setRecoveryAttempt(0);
        silentAudioTimeRef.current = null;
        
        console.log('Audio system reset');
    };

    // Reset the penalty system - for manual calibration
    const resetPenalty = () => {
        setIosPenaltyOffset(0);
        setIosSyncMeasurements([]);
        setIosPenaltyApplied(false);
        setExtremeLagMode(false);
        
        // Clear from localStorage
        try {
            localStorage.removeItem('musicRadioIOSPenalty');
        } catch (e) {
            console.error('Error clearing iOS penalty', e);
        }
        
        console.log('Penalty system reset - will recalibrate on next play');
    };

    // Get sync status color
    const getSyncStatusColor = () => {
        switch (syncStatus) {
            case 'synced': return 'bg-green-500';
            case 'syncing': return 'bg-yellow-500';
            case 'out-of-sync': return 'bg-red-500';
            default: return 'bg-red-500';
        }
    };

    // Recovery button should appear if we've attempted recovery multiple times
    const showRecoveryButton = !isMuted && isPlaying && recoveryAttempt > 1;

    // Update the iOS penalty system to preserve measurements better
    const updateIOSPenalty = (diffMs: number): void => {
        if (!isIOSRef.current) return;
        
        // Don't use very large differences that might be temporary issues
        if (Math.abs(diffMs) > IOS_EXTREME_LAG_THRESHOLD) {
            console.log(`Extreme lag difference ignored for penalty calculation: ${diffMs.toFixed(0)}ms`);
            return;
        }
        
        // Add current difference to measurements - always collect data
        const newMeasurements = [...iosSyncMeasurements, diffMs];
        if (newMeasurements.length > IOS_MEASUREMENT_MAX_SIZE) {
            newMeasurements.shift(); // Remove oldest
        }
        setIosSyncMeasurements(newMeasurements);
        
        // Check if we're in extreme lag mode - analyze recent measurements
        if (newMeasurements.length >= 5) {
            const recentSamples = newMeasurements.slice(-5);
            const avgDiff = recentSamples.reduce((sum, val) => sum + val, 0) / recentSamples.length;
            
            // If average lag is very high, enter extreme lag mode
            if (Math.abs(avgDiff) > EXTREME_LAG_MODE_THRESHOLD && !extremeLagMode) {
                setExtremeLagMode(true);
                console.log(`Entering extreme lag mode - avg lag: ${avgDiff.toFixed(0)}ms`);
            } else if (Math.abs(avgDiff) < EXTREME_LAG_MODE_THRESHOLD && extremeLagMode) {
                setExtremeLagMode(false);
                console.log(`Exiting extreme lag mode - avg lag: ${avgDiff.toFixed(0)}ms`);
            }
        }
        
        // Don't update the actual penalty if recently applied (but keep collecting data)
        if (iosPenaltyApplied) {
            // Reset flag after collecting more measurements
            if (iosSyncMeasurements.length >= 5) {
                setIosPenaltyApplied(false);
            }
            return;
        }
        
        // Only update penalty if we have enough samples and not in penalty cooldown
        if (newMeasurements.length >= IOS_MIN_CONSISTENT_SAMPLES) {
            // Calculate average of most recent measurements (last 3-5)
            const recentSamples = newMeasurements.slice(-5);
            const avgDiff = recentSamples.reduce((sum, val) => sum + val, 0) / recentSamples.length;
            
            // Only apply penalty for significant consistent differences
            if (Math.abs(avgDiff) > IOS_PENALTY_THRESHOLD) {
                // Calculate new penalty - avgDiff is positive when we're behind, so we add
                // a positive penalty to start ahead next time
                const newPenalty = iosPenaltyOffset + (avgDiff * IOS_PENALTY_LEARN_RATE);
                
                // Clamp to reasonable limits - use higher limit for extreme lag cases
                const maxLimit = extremeLagMode ? IOS_MAX_PENALTY : Math.min(800, IOS_MAX_PENALTY);
                const clampedPenalty = Math.max(-maxLimit, Math.min(maxLimit, newPenalty));
                
                if (Math.abs(clampedPenalty - iosPenaltyOffset) > 10) {
                    setIosPenaltyOffset(clampedPenalty);
                    console.log(`Updated iOS penalty offset: ${Math.round(clampedPenalty)}ms based on avg diff ${Math.round(avgDiff)}ms${extremeLagMode ? ' (extreme lag mode)' : ''}`);
                    
                    // Store to localStorage
                    try {
                        localStorage.setItem('musicRadioIOSPenalty', clampedPenalty.toString());
                    } catch (e) {
                        console.error('Error saving iOS penalty', e);
                    }
                }
            }
        }
    };

    // Add a debug info panel component to display iOS sync metrics
    const renderDebugInfo = () => {
        if (!isIOSRef.current && !showDebugInfo) return null;
        
        // Calculate average lag from recent measurements for display
        let avgLag = 0;
        if (iosSyncMeasurements.length > 0) {
            const recentSamples = iosSyncMeasurements.slice(-5);
            avgLag = recentSamples.reduce((sum, val) => sum + val, 0) / recentSamples.length;
        }
        
        return (
            <div className="mt-3 p-2 bg-tertiary rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium">
                        iOS Sync Debug
                        {extremeLagMode && <span className="ml-1 text-accent">(Extreme Lag)</span>}
                    </h4>
                    <button 
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="text-accent text-xs"
                    >
                        {showDebugInfo ? 'Hide' : 'Show'}
                    </button>
                </div>
                
                {showDebugInfo && (
                    <>
                        <div className="flex justify-between mb-1">
                            <span>Penalty Offset:</span>
                            <span className={Math.abs(iosPenaltyOffset) > 800 ? 'text-red-500' : Math.abs(iosPenaltyOffset) > 100 ? 'text-accent' : ''}>
                                {iosPenaltyOffset.toFixed(0)}ms
                            </span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Penalty Applied:</span>
                            <span>{iosPenaltyApplied ? 'Yes' : 'No'}</span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Avg Lag (last 5):</span>
                            <span className={Math.abs(avgLag) > 1000 ? 'text-red-500' : Math.abs(avgLag) > 500 ? 'text-accent' : ''}>
                                {avgLag.toFixed(0)}ms
                            </span>
                        </div>
                        
                        <div className="mb-1">
                            <div className="flex justify-between">
                                <span>Recent Lag (ms):</span>
                                <span>{iosSyncMeasurements.length} samples</span>
                            </div>
                            
                            <div className="mt-1 h-8 bg-black/20 relative rounded overflow-hidden">
                                {/* Zero line */}
                                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30"></div>
                                
                                {/* Acceptable range indicator */}
                                <div className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 bg-green-500/10"></div>
                                
                                {/* Extreme lag mode indicator */}
                                {extremeLagMode && (
                                    <div className="absolute left-0 right-0 top-0 h-full bg-red-500/10"></div>
                                )}
                                
                                {/* Lag measurements */}
                                {iosSyncMeasurements.map((diff, index) => {
                                    // Map the lag value to a position in the graph
                                    // Use dynamic scale based on extreme lag mode
                                    const maxLag = extremeLagMode ? 2000 : 800;
                                    const position = 50 - (diff / maxLag * 50);
                                    const clampedPosition = Math.max(0, Math.min(100, position));
                                    
                                    // Determine color based on lag
                                    let color = 'bg-green-500';
                                    if (Math.abs(diff) > 1000) {
                                        color = 'bg-red-500';
                                    } else if (Math.abs(diff) > IOS_SYNC_THRESHOLD_MS) {
                                        color = 'bg-accent';
                                    }
                                    
                                    return (
                                        <div
                                            key={index}
                                            className={`absolute w-1 h-3 ${color} rounded-sm`}
                                            style={{
                                                left: `${(index / Math.max(1, iosSyncMeasurements.length - 1)) * 100}%`,
                                                top: `${clampedPosition}%`,
                                                opacity: (index / iosSyncMeasurements.length) * 0.8 + 0.2
                                            }}
                                        ></div>
                                    )
                                })}
                            </div>
                            
                            <div className="flex justify-between text-xs opacity-60 mt-1">
                                <span className="text-green-500/70">-500ms OK</span>
                                <span>0</span>
                                <span className="text-red-500/70">+{extremeLagMode ? '2000' : '800'}ms</span>
                            </div>
                        </div>
                        
                        <div className="text-xs opacity-70 mt-1">
                            {iosSyncMeasurements.length > 0 ? (
                                <span>
                                    Last: {iosSyncMeasurements[iosSyncMeasurements.length - 1]?.toFixed(0)}ms
                                    (Positive = Device Behind)
                                </span>
                            ) : (
                                <span>No measurements yet</span>
                            )}
                        </div>
                        
                        <div className="mt-2">
                            <button 
                                onClick={resetPenalty}
                                className="text-xs px-2 py-1 bg-black/20 text-accent rounded-md w-full"
                            >
                                Reset Penalty System
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="card h-fit w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-primary">Fishing Village Radio</h1>
                <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${getSyncStatusColor()}`}></div>
                    <span className="text-accent text-sm font-medium">LIVE</span>
                </div>
            </div>

            <audio
                src={audioUrl}
                ref={audioRef}
                onPlay={handlePlaying}
                onPause={handlePause}
                onEnded={handleEnded}
                onLoadedMetadata={handleMetadataLoaded}
                preload="auto"
                className="hidden"
            />

            <p className="text-secondary mb-2">Enjoy the tunes in sync with the party</p>

            <div className="flex items-center gap-2">
                <div className="h-full aspect-square bg-primary p-1 rounded-md size-16 flex items-center justify-center">
                    <div className="h-full aspect-square bg-tertiary rounded-full overflow-hidden animate-spin-slow">
                        <div className="w-1/2 bg-accent h-1 absolute top-1/2 -translate-y-1/2 left-1/2"></div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mt-4 mb-2">
                        <p className="text-secondary text-sm">
                            {formatTime(currentTimeMs)} / 30:00
                        </p>
                        <div className="flex gap-2">
                            {showRecoveryButton && (
                                <button
                                    onClick={resetAudio}
                                    className="text-sm px-2 py-1 bg-tertiary text-accent rounded-md"
                                >
                                    Reset Audio
                                </button>
                            )}
                        <button
                            onClick={toggleMute}
                            className="button flex items-center"
                        >
                            {isMuted ? 'Listen' : 'Mute'}
                        </button>
                        </div>
                    </div>

                    <div className="relative w-full h-1 bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-accent"
                            style={{ width: `${(currentTimeMs / audioDurationInMilliseconds) * 100}%` }}
                        ></div>
                    </div>

                    <p className="text-sm mt-2 text-secondary">
                        Status: {isMuted ? 'Muted' : isPlaying ? syncStatus === 'synced' ? 'In Sync' : syncStatus === 'syncing' ? 'Syncing...' : 'Synchronizing...' : 'Connecting...'}
                        {isIOSRef.current && ' (iOS)'}
                    </p>
                    
                    {/* Add the debug info panel */}
                    {isIOSRef.current && renderDebugInfo()}
                    
                    {/* Add debug toggle for non-iOS devices */}
                    {!isIOSRef.current && (
                        <div className="mt-3 text-center">
                            <button 
                                onClick={() => setShowDebugInfo(!showDebugInfo)}
                                className="text-xs text-accent/70 hover:text-accent"
                            >
                                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
                            </button>
                            {showDebugInfo && renderDebugInfo()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
