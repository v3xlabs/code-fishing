// https://www.youtube.com/watch?v=lp74O7UwBIQ

import { useState, useEffect, useRef, type FC } from 'react';

export const MusicRadio: FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const syncIntervalRef = useRef<number | null>(null);
    const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'out-of-sync'>('syncing');
    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
    const [deviceOffset, setDeviceOffset] = useState<number>(0);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    // More aggressive learning for iOS devices
    const [syncHistory, setSyncHistory] = useState<Array<{time: number, diff: number}>>([]);
    const [iosAdjustmentFactor, setIosAdjustmentFactor] = useState<number>(1.5);

    // Add state for stability management
    const [lastHardSyncTime, setLastHardSyncTime] = useState<number>(0);
    const [stabilizationMode, setStabilizationMode] = useState<boolean>(false);
    const [consecutiveSyncedChecks, setConsecutiveSyncedChecks] = useState<number>(0);

    // System-wide platform offset to help desktop match iOS
    const [platformOffset, setPlatformOffset] = useState<number>(0); // Start with desktop 2 seconds behind
    const [platformOffsetEnabled, setPlatformOffsetEnabled] = useState<boolean>(false);

    // Audio source
    const audioUrl = 'https://v3x.video/drop/fishing_village.mp3';
    const audioDurationInMilliseconds = 30 * 60 * 1000; // 30 minutes in ms

    // Sync configuration
    const SYNC_INTERVAL = 5000; // Check sync every 5 seconds
    const SYNC_THRESHOLD_MS = 250; // Threshold for considering "in sync"
    const HARD_SYNC_THRESHOLD_MS = 1000; // Threshold for hard re-sync
    const IOS_SYNC_THRESHOLD_MS = 500; // More forgiving threshold for iOS

    // Detect device type on mount
    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);
        
        const mobileCheck = isIOSDevice || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        
        console.log(`Device detection: ${isIOSDevice ? 'iOS' : mobileCheck ? 'Mobile' : 'Desktop'}`);
        
        // Load saved device offset from localStorage if available
        try {
            const savedOffset = localStorage.getItem('musicRadioDeviceOffset');
            if (savedOffset) {
                const parsedOffset = parseInt(savedOffset, 10);
                if (!isNaN(parsedOffset) && Math.abs(parsedOffset) < 2000) {
                    setDeviceOffset(parsedOffset);
                    console.log(`Loaded device offset: ${parsedOffset}ms`);
                }
            } else if (isIOSDevice) {
                // For iOS devices with no saved offset, start with a more aggressive initial offset
                // iOS typically has higher audio latency
                setDeviceOffset(500);
                console.log(`Set initial iOS offset: 500ms`);
            }
            
            // Load platform offset setting
            const platformOffsetSetting = localStorage.getItem('musicRadioPlatformOffsetEnabled');
            if (platformOffsetSetting === 'true' && !isIOSDevice) {
                setPlatformOffsetEnabled(true);
                console.log(`Enabled platform offset: ${platformOffset}ms`);
            }
        } catch (e) {
            console.error('Error loading settings', e);
        }
    }, []);

    // Calculate the exact time position based on UTC time mod audio duration
    const calculateTimePosition = (): number => {
        const now = Date.now();
        return now % audioDurationInMilliseconds;
    };

    // Get the target position with device and platform offsets applied
    const getTargetPositionWithOffset = (): number => {
        const baseTimePosition = calculateTimePosition();
        
        // Apply device-specific offset
        let offsetPosition = baseTimePosition + deviceOffset;
        
        // If not on iOS but platform offset is enabled, apply platform offset
        // This allows desktop to match iOS timing
        if (!isIOS && platformOffsetEnabled) {
            offsetPosition += platformOffset;
        }
        
        return offsetPosition;
    };

    // Learn from sync attempts to improve device offset
    const learnDeviceOffset = (diffMs: number): void => {
        // Don't adjust for extreme differences
        if (Math.abs(diffMs) > 2000) return;
        
        // Update sync history
        const newHistory = [...syncHistory, {time: Date.now(), diff: diffMs}];
        // Keep only the last 10 sync attempts
        if (newHistory.length > 10) {
            newHistory.shift();
        }
        setSyncHistory(newHistory);
        
        // Apply smoothing to iOS adjustments to prevent oscillation
        if (isIOS && newHistory.length >= 3) {
            // Check if we're oscillating around the target
            const isOscillating = detectOscillation(newHistory);
            
            if (isOscillating) {
                console.log("Detected oscillation, applying heavy damping");
                // Apply heavy damping if oscillating
                const avgDiff = newHistory.slice(-3).reduce((sum, entry) => sum + entry.diff, 0) / 3;
                // Very small adjustment to converge slowly
                const dampedDiffMs = avgDiff * 0.15;
                applyOffsetAdjustment(dampedDiffMs);
                return;
            }
        }
        
        // Standard learning process
        let learningRate = 0.1; // Default learning rate
        
        // For iOS, use a dynamic adjustment factor based on recent sync history
        if (isIOS) {
            // Reduce learning rate if in stabilization mode
            if (stabilizationMode) {
                learningRate = 0.05;
                console.log("Using reduced learning rate in stabilization mode");
            } else {
                // Calculate the trend in sync differences
                const recentTrend = calculateSyncTrend(newHistory);
                
                // Adjust learning rate based on consistency of drift
                if (recentTrend.consistent) {
                    // Moderate adjustment for consistent drift on iOS
                    learningRate = 0.2 * iosAdjustmentFactor;
                    
                    // Only increase adjustment factor if drift is large and increasing
                    if (recentTrend.driftIncreasing && Math.abs(diffMs) > IOS_SYNC_THRESHOLD_MS) {
                        const newFactor = Math.min(3.0, iosAdjustmentFactor * 1.1);
                        setIosAdjustmentFactor(newFactor);
                        console.log(`iOS adjustment factor increased to ${newFactor.toFixed(2)}`);
                    }
                } else {
                    // More conservative adjustment for inconsistent drift
                    learningRate = 0.15;
                    
                    // Decrease adjustment factor gradually if drift is inconsistent
                    const newFactor = Math.max(1.0, iosAdjustmentFactor * 0.95);
                    setIosAdjustmentFactor(newFactor);
                }
                
                console.log(`iOS learning rate: ${learningRate.toFixed(2)} (factor: ${iosAdjustmentFactor.toFixed(2)})`);
            }
        }
        
        applyOffsetAdjustment(diffMs * learningRate);
    };
    
    // Calculate trend in sync differences to optimize iOS adjustment
    const calculateSyncTrend = (history: Array<{time: number, diff: number}>) => {
        if (history.length < 3) {
            return { consistent: false, driftIncreasing: false };
        }
        
        // Get the last 5 sync attempts or all if less than 5
        const recentHistory = history.slice(-5);
        
        // Calculate the sign of each difference
        const signs = recentHistory.map(entry => Math.sign(entry.diff));
        
        // Check if drift is consistently in the same direction
        const allPositive = signs.every(sign => sign > 0);
        const allNegative = signs.every(sign => sign < 0);
        const consistent = allPositive || allNegative;
        
        // Check if the magnitude of drift is increasing
        let driftIncreasing = false;
        if (consistent && recentHistory.length >= 3) {
            const magnitudes = recentHistory.map(entry => Math.abs(entry.diff));
            
            // Compare the average of the last 2 entries with the average of the previous entries
            const recentAvg = (magnitudes[magnitudes.length-1] + magnitudes[magnitudes.length-2]) / 2;
            const previousAvg = magnitudes.slice(0, -2).reduce((sum, val) => sum + val, 0) / (magnitudes.length - 2);
            
            driftIncreasing = recentAvg > previousAvg;
        }
        
        return { consistent, driftIncreasing };
    };

    // Synchronize the audio playback with the calculated position
    const synchronizeAudio = () => {
        if (!audioRef.current || !isPlaying || isMuted) return;
        
        const now = Date.now();
        const targetPositionMs = getTargetPositionWithOffset();
        const currentPositionMs = audioRef.current.currentTime * 1000;
        const diffMs = targetPositionMs - currentPositionMs;
        const absDiffMs = Math.abs(diffMs);
        
        // Update sync status for UI feedback
        // For iOS, use the dynamic threshold based on recent sync history
        const syncThreshold = isIOS ? 
            (syncHistory.length > 3 ? 
                // Adjust threshold based on consistency of sync history
                calculateSyncTrend(syncHistory).consistent ? 
                    IOS_SYNC_THRESHOLD_MS * 0.8 : IOS_SYNC_THRESHOLD_MS * 1.2 
                : IOS_SYNC_THRESHOLD_MS) 
            : SYNC_THRESHOLD_MS;
        
        // Add hysteresis to sync status changes for stability
        // Once in synced state, be more lenient about staying there
        const exitSyncThreshold = syncThreshold * 1.5; // Harder to exit sync state once achieved
        
        // Update sync status with hysteresis
        if (absDiffMs <= syncThreshold) {
            setSyncStatus('synced');
            // Track consecutive synced checks for stabilization
            setConsecutiveSyncedChecks(prev => prev + 1);
            if (consecutiveSyncedChecks >= 3 && !stabilizationMode) {
                console.log("Entering stabilization mode after consistent sync");
                setStabilizationMode(true);
            }
        } else if (syncStatus === 'synced' && absDiffMs <= exitSyncThreshold) {
            // Stay in synced state if within exit threshold (hysteresis)
            setSyncStatus('synced');
        } else if (absDiffMs <= HARD_SYNC_THRESHOLD_MS) {
            setSyncStatus('syncing');
            setConsecutiveSyncedChecks(0);
            if (stabilizationMode) {
                setStabilizationMode(false);
            }
        } else {
            setSyncStatus('out-of-sync');
            setConsecutiveSyncedChecks(0);
            if (stabilizationMode) {
                setStabilizationMode(false);
            }
        }
        
        // Log current synchronization state
        console.log(`Sync check: target=${targetPositionMs.toFixed(0)}ms, current=${currentPositionMs.toFixed(0)}ms, diff=${diffMs.toFixed(0)}ms, stabilized=${stabilizationMode}`);
        
        // For iOS, be more aggressive with sync corrections, but with stability guards
        const iosHardSyncThreshold = isIOS ? (HARD_SYNC_THRESHOLD_MS * 0.7) : HARD_SYNC_THRESHOLD_MS;
        
        // Rate limiting for hard syncs to prevent rapid jumping
        const hardSyncCooldown = isIOS ? 6000 : 4000; // Longer cooldown for iOS
        const canDoHardSync = (now - lastHardSyncTime) > hardSyncCooldown;
        
        // Adjust playback if needed, with stability mechanisms
        if (absDiffMs > syncThreshold) {
            // In stabilization mode, use only gentle corrections
            if (stabilizationMode && isIOS) {
                // Use only soft corrections when stable
                if (absDiffMs < exitSyncThreshold * 1.2) {
                    // Minor playback rate adjustment
                    const gentleRate = 1 + (Math.sign(diffMs) * 0.02);
                    audioRef.current.playbackRate = gentleRate;
                    console.log(`Stabilized gentle rate adjustment: ${gentleRate.toFixed(2)}`);
                    
                    // Reset rate after a short period
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.playbackRate = 1.0;
                        }
                    }, 1000);
                    
                    // Very small learning
                    learnDeviceOffset(diffMs * 0.03);
                    return; // Skip more aggressive corrections
                } else {
                    // If we've drifted too far even in stabilization mode
                    console.log("Exiting stabilization mode due to significant drift");
                    setStabilizationMode(false);
                }
            }
            
            // For large differences, perform a hard sync, but with rate limiting
            if ((absDiffMs > iosHardSyncThreshold || (isIOS && absDiffMs > IOS_SYNC_THRESHOLD_MS * 1.2)) && canDoHardSync) {
                console.log(`Hard sync: setting position to ${targetPositionMs.toFixed(0)}ms`);
                setLastHardSyncTime(now); // Update last hard sync time
                
                // For iOS, add a slight predictive adjustment to account for known latency
                // But reduce the predictive factor in stabilization mode
                if (isIOS) {
                    // Reduce predictive adjustment if we've been oscillating
                    const hasRecentOscillation = detectOscillation(syncHistory);
                    // If we're consistently behind (positive diff), add a small predictive offset
                    const predictiveAdjustmentMs = diffMs > 0 ? 
                        (hasRecentOscillation ? 50 : 100) : 0;
                    audioRef.current.currentTime = (targetPositionMs + predictiveAdjustmentMs) / 1000;
                    console.log(`Added iOS predictive adjustment of ${predictiveAdjustmentMs}ms`);
                } else {
                    audioRef.current.currentTime = targetPositionMs / 1000;
                }
                
                // Learn from this sync attempt with dynamic adjustment
                // Reduce learning rate if we've been making lots of adjustments
                const recentChangeRate = calculateRecentChangeRate(syncHistory);
                const stabilityFactor = Math.max(0.3, 1 - recentChangeRate);
                learnDeviceOffset(diffMs * stabilityFactor);
                
                console.log(`Applied stability factor ${stabilityFactor.toFixed(2)} to learning`);
            } 
            // For smaller differences, adjust playback rate to catch up gradually
            else if (!canDoHardSync || absDiffMs <= iosHardSyncThreshold) {
                // For iOS, use more gradual rate adjustments if we've been making frequent changes
                const recentChangeRate = calculateRecentChangeRate(syncHistory);
                const stabilityFactor = Math.max(0.4, 1 - recentChangeRate);
                
                // More conservative rate adjustment based on stability
                const catchupRate = calculateCatchupRate(diffMs * stabilityFactor);
                console.log(`Soft sync: adjusting playback rate to ${catchupRate.toFixed(2)} (stability: ${stabilityFactor.toFixed(2)})`);
                audioRef.current.playbackRate = catchupRate;
                
                // For iOS, also learn from soft syncs with increased weight, but apply stability
                if (isIOS) {
                    learnDeviceOffset(diffMs * 0.5 * stabilityFactor);
                }
                
                // Reset playback rate after a delay
                const resetDelay = isIOS ? 1500 : 3000; // Shorter reset time for iOS
                setTimeout(() => {
                    if (audioRef.current) {
                        audioRef.current.playbackRate = 1.0;
                    }
                }, resetDelay);
            }
        } else if (isIOS && syncStatus === 'synced' && syncHistory.length >= 3) {
            // If we're in sync and have enough history, fine-tune the iOS offset gradually
            // But apply much softer adjustments to prevent oscillation
            const recentHistory = syncHistory.slice(-3);
            const avgDiff = recentHistory.reduce((sum, entry) => sum + entry.diff, 0) / recentHistory.length;
            
            // Only adjust if there's a consistent small offset, and apply very small changes
            if (Math.abs(avgDiff) > 30 && Math.abs(avgDiff) < 200) {
                console.log(`Fine-tuning iOS offset based on avg diff: ${avgDiff.toFixed(1)}ms`);
                // Much more conservative adjustment when already in sync
                learnDeviceOffset(avgDiff * 0.05);
            }
        }
    };

    // Detect if the sync adjustments are oscillating (alternating positive/negative)
    const detectOscillation = (history: Array<{time: number, diff: number}>): boolean => {
        if (history.length < 4) return false;
        
        const recent = history.slice(-4);
        // Check if signs are alternating
        let alternating = true;
        for (let i = 1; i < recent.length; i++) {
            if (Math.sign(recent[i].diff) === Math.sign(recent[i-1].diff)) {
                alternating = false;
                break;
            }
        }
        
        return alternating;
    };

    // Calculate how rapidly we've been changing the offset recently
    const calculateRecentChangeRate = (history: Array<{time: number, diff: number}>): number => {
        if (history.length < 5) return 0;
        
        const recent = history.slice(-5);
        let changeCount = 0;
        
        // Count direction changes
        for (let i = 1; i < recent.length; i++) {
            if (Math.sign(recent[i].diff) !== Math.sign(recent[i-1].diff)) {
                changeCount++;
            }
        }
        
        // Return a value between 0 (stable) and 1 (highly unstable)
        return changeCount / 4;
    };

    // Calculate the playback rate needed to catch up, with smoother transitions
    const calculateCatchupRate = (diffMs: number): number => {
        // diffMs > 0 means we're behind, need to speed up
        // diffMs < 0 means we're ahead, need to slow down
        
        // For iOS devices, use gentler adjustment if in stabilization mode
        const maxRate = isIOS ? 
            (stabilizationMode ? 1.08 : 1.15) : 
            (isMobile ? 1.05 : 1.2);
            
        const minRate = isIOS ? 
            (stabilizationMode ? 0.92 : 0.85) : 
            (isMobile ? 0.95 : 0.8);
        
        // Calculate rate - the further off we are, the more aggressive the adjustment
        // But normalize to a reasonable range
        const baseAdjustment = Math.min(0.2, Math.abs(diffMs) / 5000);
        
        // More aggressive for iOS but tempered by stabilization mode
        const adjustment = isIOS ? 
            (stabilizationMode ? baseAdjustment * 0.8 : baseAdjustment * 1.5) : 
            baseAdjustment;
            
        const rate = diffMs > 0 ? 1 + adjustment : 1 - adjustment;
        
        // Clamp rate to reasonable bounds
        return Math.max(minRate, Math.min(maxRate, rate));
    };

    // Apply the actual offset adjustment with additional safeguards
    const applyOffsetAdjustment = (adjustment: number) => {
        // Limit maximum single adjustment to prevent large jumps
        const maxSingleAdjustment = isIOS ? 
            (stabilizationMode ? 50 : 150) : 100;
        
        const cappedAdjustment = Math.sign(adjustment) * 
            Math.min(Math.abs(adjustment), maxSingleAdjustment);
            
        if (Math.abs(cappedAdjustment) < Math.abs(adjustment)) {
            console.log(`Capped adjustment from ${adjustment.toFixed(1)}ms to ${cappedAdjustment.toFixed(1)}ms`);
        }
        
        // Update device offset with the capped adjustment
        const newOffset = deviceOffset + cappedAdjustment;
        setDeviceOffset(newOffset);
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('musicRadioDeviceOffset', Math.round(newOffset).toString());
            console.log(`Updated device offset: ${Math.round(newOffset)}ms (adj: ${cappedAdjustment.toFixed(1)}ms)`);
        } catch (e) {
            console.error('Error saving device offset', e);
        }
    };

    // Set up periodic synchronization
    useEffect(() => {
        // Clear any existing interval
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }
        
        // Set up new interval if playing and not muted
        if (isPlaying && !isMuted) {
            const intervalId = window.setInterval(synchronizeAudio, SYNC_INTERVAL);
            syncIntervalRef.current = intervalId;
            
            // Initial sync
            synchronizeAudio();
        }
        
        // Cleanup on unmount or when dependencies change
        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }
        };
    }, [isPlaying, isMuted, deviceOffset]);

    // Update current time for display purposes
    useEffect(() => {
        const timer = setInterval(() => {
            const positionMs = calculateTimePosition();
            setCurrentTimeMs(positionMs);
        }, 500);
        
        return () => clearInterval(timer);
    }, []);

    // Prepare audio and start playback
    const prepareAndPlay = async () => {
        if (!audioRef.current) return;
        
        try {
            // Set to correct position before attempting to play
            const targetPositionMs = getTargetPositionWithOffset();
            audioRef.current.currentTime = targetPositionMs / 1000;
            
            // Short delay to allow buffering
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Start playback
            await audioRef.current.play();
            setIsPlaying(true);
            
            // Re-sync after playback starts
            setTimeout(() => {
                synchronizeAudio();
            }, 300);
            
            console.log('Audio playback started successfully');
        } catch (err) {
            console.error('Play prevented:', err);
            setIsPlaying(false);
        }
    };

    // Handle audio events
    const handleMetadataLoaded = () => {
        setIsAudioReady(true);
        console.log('Audio metadata loaded');
    };

    const handlePlaying = () => {
        setIsPlaying(true);
        console.log('Audio playing');
    };

    const handlePause = () => {
        setIsPlaying(false);
        console.log('Audio paused');
    };

    const handleEnded = () => {
        if (!audioRef.current) return;
        
        // Handle loop - instead of relying on loop attribute
        const targetPositionMs = getTargetPositionWithOffset();
        audioRef.current.currentTime = targetPositionMs / 1000;
        audioRef.current.play().catch(console.error);
        console.log('Audio loop handling');
    };

    // Toggle mute/unmute
    const toggleMute = () => {
        if (!audioRef.current) return;
        
        if (isMuted) {
            // Start playback when unmuting
            audioRef.current.muted = false;
            prepareAndPlay().catch(err => {
                console.error('Play after unmute failed:', err);
            });
        } else {
            // Pause and mute when muting
            audioRef.current.pause();
            audioRef.current.muted = true;
        }
        
        setIsMuted(!isMuted);
    };

    // Reset everything (for debugging/recovery)
    const resetAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setIsMuted(true);
            audioRef.current.muted = true;
            audioRef.current.currentTime = getTargetPositionWithOffset() / 1000;
            
            console.log('Audio system reset');
        }
    };

    // Format time for display in mm:ss format
    const formatTime = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

    // Force resync button with stability improvements
    const forceResync = () => {
        if (!audioRef.current || !isPlaying) return;
        
        // Reset stability states
        setStabilizationMode(false);
        setConsecutiveSyncedChecks(0);
        setLastHardSyncTime(Date.now());
        
        // Force aggressive re-sync
        const targetPositionMs = getTargetPositionWithOffset();
        audioRef.current.currentTime = targetPositionMs / 1000;
        
        // For iOS, add an additional predictive offset
        if (isIOS) {
            const mostRecentDiff = syncHistory.length > 0 ? 
                syncHistory[syncHistory.length - 1].diff : 0;
            
            // More conservative predictive adjustment
            const predictiveAdjustment = mostRecentDiff > 0 ? 50 : 0;
            audioRef.current.currentTime += predictiveAdjustment / 1000;
            
            console.log(`Force re-sync with ${predictiveAdjustment}ms predictive adjustment`);
        }
        
        console.log(`Forced re-sync to ${targetPositionMs.toFixed(0)}ms`);
    };

    // Toggle platform offset for desktop browsers
    const togglePlatformOffset = () => {
        const newValue = !platformOffsetEnabled;
        setPlatformOffsetEnabled(newValue);
        
        // Save setting
        try {
            localStorage.setItem('musicRadioPlatformOffsetEnabled', newValue.toString());
        } catch (e) {
            console.error('Error saving platform offset setting', e);
        }
        
        // If we're enabling, force a resync right away
        if (newValue && !isIOS && audioRef.current) {
            const targetPositionMs = getTargetPositionWithOffset();
            audioRef.current.currentTime = targetPositionMs / 1000;
            console.log(`Applied platform offset: ${platformOffset}ms, new target: ${targetPositionMs}ms`);
        }
    };

    // Adjust platform offset value
    const adjustPlatformOffset = (amount: number) => {
        const newOffset = platformOffset + amount;
        // Limit to reasonable range (-5000 to 0)
        const limitedOffset = Math.max(-5000, Math.min(0, newOffset));
        setPlatformOffset(limitedOffset);
        
        // If enabled, apply the change immediately
        if (platformOffsetEnabled && !isIOS && audioRef.current && isPlaying) {
            const targetPositionMs = getTargetPositionWithOffset();
            audioRef.current.currentTime = targetPositionMs / 1000;
            console.log(`Adjusted platform offset to: ${limitedOffset}ms, new target: ${targetPositionMs}ms`);
        }
    };

    // Render debug info panel with enhanced options for cross-device sync
    const renderDebugInfo = () => {
        if (!showDebugInfo) return null;
        
        return (
            <div className="mt-3 p-2 bg-tertiary rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium">Sync Debug Info</h4>
                </div>
                
                <div className="flex justify-between mb-1">
                    <span>Device Type:</span>
                    <span>
                        {isIOS ? 'iOS' : isMobile ? 'Mobile' : 'Desktop'}
                    </span>
                </div>
                
                <div className="flex justify-between mb-1">
                    <span>Device Offset:</span>
                    <span>
                        {deviceOffset.toFixed(0)}ms
                    </span>
                </div>
                
                {!isIOS && (
                    <>
                        <div className="flex justify-between mb-1">
                            <span>Platform Offset:</span>
                            <span className={platformOffsetEnabled ? "text-green-500" : "text-gray-500"}>
                                {platformOffset.toFixed(0)}ms {platformOffsetEnabled ? "(active)" : "(inactive)"}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-1">
                            <span>Match iOS Timing:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={platformOffsetEnabled}
                                    onChange={togglePlatformOffset}
                                />
                                <div className="w-9 h-5 bg-tertiary peer-focus:outline-none rounded-full peer 
                                              peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                              after:start-[2px] after:bg-white after:border-gray-300 after:border 
                                              after:rounded-full after:h-4 after:w-4 after:transition-all 
                                              peer-checked:bg-accent"></div>
                            </label>
                        </div>
                        
                        {platformOffsetEnabled && (
                            <div className="flex items-center justify-between my-2">
                                <button 
                                    onClick={() => adjustPlatformOffset(-500)}
                                    className="px-2 py-1 bg-black/20 text-accent rounded-md"
                                >
                                    −0.5s
                                </button>
                                <button 
                                    onClick={() => adjustPlatformOffset(-100)}
                                    className="px-2 py-1 bg-black/20 text-accent rounded-md"
                                >
                                    −0.1s
                                </button>
                                <button 
                                    onClick={() => adjustPlatformOffset(100)}
                                    className="px-2 py-1 bg-black/20 text-accent rounded-md"
                                >
                                    +0.1s
                                </button>
                                <button 
                                    onClick={() => adjustPlatformOffset(500)}
                                    className="px-2 py-1 bg-black/20 text-accent rounded-md"
                                >
                                    +0.5s
                                </button>
                            </div>
                        )}
                    </>
                )}
                
                {isIOS && (
                    <>
                        <div className="flex justify-between mb-1">
                            <span>iOS Adjustment Factor:</span>
                            <span>{iosAdjustmentFactor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Stabilization Mode:</span>
                            <span className={stabilizationMode ? "text-green-500" : "text-yellow-500"}>
                                {stabilizationMode ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Sync Checks:</span>
                            <span>{consecutiveSyncedChecks}</span>
                        </div>
                    </>
                )}
                
                <div className="flex justify-between mb-1">
                    <span>Sync Status:</span>
                    <span className={
                        syncStatus === 'synced' ? 'text-green-500' : 
                        syncStatus === 'syncing' ? 'text-yellow-500' : 
                        'text-red-500'
                    }>
                        {syncStatus}
                    </span>
                </div>
                
                {audioRef.current && (
                    <>
                        <div className="flex justify-between mb-1">
                            <span>Current Time:</span>
                            <span>{audioRef.current.currentTime.toFixed(2)}s</span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Target Time:</span>
                            <span>{(getTargetPositionWithOffset() / 1000).toFixed(2)}s</span>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Playback Rate:</span>
                            <span>{audioRef.current.playbackRate.toFixed(2)}x</span>
                        </div>
                        
                        {syncHistory.length > 0 && (
                            <div className="flex justify-between mb-1">
                                <span>Avg Drift (last 5):</span>
                                <span>
                                    {(syncHistory.slice(-5).reduce((sum, entry) => sum + entry.diff, 0) / 
                                      Math.min(5, syncHistory.length)).toFixed(1)}ms
                                </span>
                            </div>
                        )}
                    </>
                )}
                
                {isIOS && (
                    <div className="mt-2">
                        <button 
                            onClick={forceResync}
                            className="text-xs px-2 py-1 bg-black/20 text-accent rounded-md w-full mb-2"
                        >
                            Force Re-sync (iOS)
                        </button>
                    </div>
                )}
                
                <div className="mt-2">
                    <button 
                        onClick={() => {
                            setDeviceOffset(isIOS ? 500 : 0); // Reset to initial iOS offset
                            setSyncHistory([]);
                            setIosAdjustmentFactor(1.5);
                            setStabilizationMode(false);
                            setConsecutiveSyncedChecks(0);
                            if (!isIOS) {
                                setPlatformOffsetEnabled(false);
                                setPlatformOffset(-2000);
                                localStorage.removeItem('musicRadioPlatformOffsetEnabled');
                            }
                            localStorage.removeItem('musicRadioDeviceOffset');
                        }}
                        className="text-xs px-2 py-1 bg-black/20 text-accent rounded-md w-full"
                    >
                        Reset All Offsets
                    </button>
                </div>
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
                            <button
                                onClick={resetAudio}
                                className="text-sm px-2 py-1 bg-tertiary text-accent rounded-md"
                            >
                                Reset
                            </button>
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
                        Status: {isMuted ? 'Muted' : isPlaying ? 
                            syncStatus === 'synced' ? 'In Sync' : 
                            syncStatus === 'syncing' ? 'Syncing...' : 
                            'Synchronizing...' : 'Connecting...'}
                    </p>
                    
                    <div className="mt-3 text-center">
                        <button 
                            onClick={() => setShowDebugInfo(!showDebugInfo)}
                            className="text-xs text-accent/70 hover:text-accent"
                        >
                            {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
                        </button>
                        {renderDebugInfo()}
                    </div>
                </div>
            </div>
        </div>
    );
};
