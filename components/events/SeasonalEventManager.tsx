'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEventConfigFromApi } from '@/services/systemService';
import { EventManagerConfig } from '@/types/system';
import Lottie from 'lottie-react';
import Confetti from 'react-confetti';
import useWindowSize from '@/hooks/useWindowSize';
import { Box, Typography, Button, IconButton } from '@mui/material';

// Placeholder for verified Fireworks Lottie JSON URL
const FIREWORKS_LOTTIE_URL = "https://lottie.host/88af9b8a-1317-4860-9118-4903e670ca10/valid-fireworks.json";

// Time Sync Constants
const SYNC_INTERVAL = 1000 * 60 * 10; // 10 minutes
const TICK_RATE = 1000; // 1 second update loop

type EventState = 'IDLE' | 'THEME_ACTIVE' | 'CELEBRATION' | 'LOCKED';

export default function SeasonalEventManager() {
    const { user, loading } = useAuth();
    // [CHANGE] Update default state
    const [globalEffects, setGlobalEffects] = useState({ snow: false, rain: false, leaves: false, confetti: false, christmas: false });
    const [config, setConfig] = useState<EventManagerConfig | null>(null);
    const [timeOffset, setTimeOffset] = useState<number>(0);
    const [currentState, setCurrentState] = useState<EventState>('IDLE');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [fireworksData, setFireworksData] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Window size for confetti
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', () => setWindowSize({ width: window.innerWidth, height: window.innerHeight }));
        }
    }, []);

    // 1. Initial Sync & Config Fetch
    useEffect(() => {
        const init = async () => {
            const result = await fetchEventConfigFromApi();
            if (result) {
                if (result.config) setConfig(result.config);

                // [NEW] Capture Global Settings
                if (result.globalEffects) {
                    setGlobalEffects(result.globalEffects);
                }

                // Keep existing offset logic
                if (result.server_time) {
                    const serverTimeMs = new Date(result.server_time).getTime() + result.latency;
                    const localTimeMs = Date.now();
                    const offset = serverTimeMs - localTimeMs;
                    setTimeOffset(offset);
                }
            }
        };
        init();
        const interval = setInterval(init, SYNC_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    // Load Lottie Data
    useEffect(() => {
        const effect = config?.climax_effect || 'fireworks';
        if (effect === 'fireworks' || effect === 'both') {
            fetch('https://lottie.host/embed/88af9b8a-1317-4860-9118-4903e670ca10/valid-fireworks.json')
                .then(r => r.json()).then(d => setFireworksData(d)).catch(e => console.log('No fireworks lottie found'));
        }
    }, [config?.climax_effect]);


    // 2. Main Logic Loop
    useEffect(() => {
        const isAnyGlobalActive = Object.values(globalEffects).some(Boolean);
        if (!config && !isAnyGlobalActive) return;

        const loop = setInterval(() => {
            const now = Date.now() + timeOffset; // Current Server Time

            if (!config) {
                setCurrentState(isAnyGlobalActive ? 'THEME_ACTIVE' : 'IDLE');
                return;
            }

            // --- TIME WINDOW CHECKS --- (Only if config exists)

            const musicStart = new Date(config.celebration_music_start).getTime();
            const musicEnd = new Date(config.celebration_music_end).getTime();

            const fireStart = config.celebration_climax_start
                ? new Date(config.celebration_climax_start).getTime()
                : musicStart + (10 * 60 * 1000);

            // Check Lock
            const lockedEventId = localStorage.getItem('truthlens_event_completed');
            const isLocked = lockedEventId === config.event_id;

            // --- INDEPENDENT LOGIC BRANCHES ---

            // 1. Music Logic (Looping) - Only plays during Phase B 'Music' window
            const shouldPlayMusic = !isLocked && (now >= musicStart && now < musicEnd) && config.is_active_global;

            if (audioRef.current && config.music_file_url) {
                if (shouldPlayMusic) {
                    if (audioRef.current.paused) {
                        audioRef.current.loop = true;
                        audioRef.current.play().catch(e => console.error("Autoplay prevented", e));
                    }
                } else {
                    if (!audioRef.current.paused) {
                        audioRef.current.pause();
                    }
                }
            }

            // 2. Countdown Logic
            const secondsUntilFire = (fireStart - now) / 1000;
            let currentCount = null;
            const isFireActive = !isLocked && (now >= fireStart && now < musicEnd) && config.is_active_global;

            if (!isLocked && config.is_active_global && secondsUntilFire > 0 && secondsUntilFire <= config.countdown_seconds) {
                currentCount = Math.ceil(secondsUntilFire);
            } else if (!isLocked && config.is_active_global && secondsUntilFire <= 0 && isFireActive) {
                currentCount = 0;
            }

            // --- STATE UPDATES ---

            // Priority: Celebration > Global Theme > Idle
            if (isFireActive || currentCount !== null) {
                setCurrentState('CELEBRATION');
            } else if (isAnyGlobalActive) {
                setCurrentState('THEME_ACTIVE');
            } else {
                setCurrentState('IDLE');
            }

            setCountdown(currentCount);

        }, TICK_RATE);

        return () => clearInterval(loop);
    }, [config, timeOffset, user, fireworksData, globalEffects]);


    // RENDERERS

    // Critical Change: Allow render if global theme is active OR event is active
    const isGlobalActive = Object.values(globalEffects).some(Boolean);
    const isEventActive = config && config.is_active_global;

    if (loading || (!isGlobalActive && !isEventActive) || currentState === 'IDLE') {
        return null;
    }

    // Derived Render State (Frame Perfect)
    const now = Date.now() + timeOffset;

    // Explicit Independent Time Windows
    // const themeStart = new Date(config.general_theme_start).getTime();
    // const themeEnd = new Date(config.general_theme_end).getTime();
    // [CHANGE] manual toggle is always "Active" in terms of window
    const isThemeActive = isGlobalActive;

    // Celebration Vars
    const musicEnd = config ? new Date(config.celebration_music_end).getTime() : 0;
    const fireStart = (config && config.celebration_climax_start) ? new Date(config.celebration_climax_start).getTime() : 0;

    // Check lock again for render
    const lockedEventId = typeof window !== 'undefined' ? localStorage.getItem('truthlens_event_completed') : null;
    const isLocked = config ? (lockedEventId === config.event_id) : false;

    // Active means: inside window AND not locked AND event active
    const isFireActive = config && isEventActive && !isLocked && (now >= fireStart && now < musicEnd);

    // --- Message Visibility Logic ---
    let showClimaxMessage = false;
    let showSpecialMessage = false;

    if (config && isEventActive) {
        // 1. Climax Message (Big Text)
        if (config.climax_message_start && config.climax_message_end) {
            const start = new Date(config.climax_message_start).getTime();
            const end = new Date(config.climax_message_end).getTime();
            showClimaxMessage = (now >= start && now < end);
        } else {
            showClimaxMessage = (now >= fireStart && now < musicEnd);
        }

        // 2. Special Message (Secondary/Thank You)
        if (config.special_message) {
            if (config.special_message_start && config.special_message_end) {
                const start = new Date(config.special_message_start).getTime();
                const end = new Date(config.special_message_end).getTime();
                showSpecialMessage = (now >= start && now < end);
            } else {
                showSpecialMessage = showClimaxMessage;
            }
        }
    }

    // Global Overlay Visibility
    // Must be unlocked AND at least one message is active AND user is logged in
    const showOverlay = !isLocked && (showClimaxMessage || showSpecialMessage) && !!user;

    // Render Logic using specific fields
    // [CHANGE] Use global theme if enabled
    const climaxEffect = config?.climax_effect || 'fireworks';

    const firstName = user?.displayName ? user.displayName.split(' ')[0] : (user?.email?.split('@')[0] || 'Friend');

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* AUDIO */}
            {config && config.music_file_url && (
                <audio ref={audioRef} src={config.music_file_url} preload="auto" loop={true} />
            )}

            {/* THEME: SNOW / RAIN / LEAVES (Phase A) */}
            {/* [CHANGE] Render if themeActive AND effect is valid */}
            {isThemeActive && globalEffects.snow && (
                <SnowEffect />
            )}
            {isThemeActive && globalEffects.rain && (
                <RainEffect />
            )}
            {isThemeActive && globalEffects.leaves && (
                <LeavesEffect />
            )}
            {isThemeActive && globalEffects.confetti && (
                <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={200} />
            )}
            {isThemeActive && globalEffects.christmas && (
                <ChristmasEffect />
            )}

            {/* CLIMAX: CONFETTI (Phase B) */}
            {(isFireActive && (climaxEffect === 'confetti' || climaxEffect === 'both')) && (
                <Confetti width={windowSize.width} height={windowSize.height} />
            )}

            {/* CLIMAX: FIREWORKS (Phase B) */}
            {(isFireActive && (climaxEffect === 'fireworks' || climaxEffect === 'both')) && fireworksData && (
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%' }}>
                    <Lottie animationData={fireworksData} loop={true} />
                </Box>
            )}

            {/* COUNTDOWN / MESSAGE OVERLAY */}
            <Box sx={{
                position: 'absolute',
                top: '20%',
                left: 0,
                width: '100%',
                textAlign: 'center',
                pointerEvents: 'auto'
            }}>
                {/* Countdown */}
                {countdown !== null && countdown > 0 && (
                    <Typography variant="h1" sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '6rem',
                        textShadow: '0 0 20px rgba(0,0,0,0.5)',
                        animation: 'pulse 1s infinite'
                    }}>
                        {countdown}
                    </Typography>
                )}

                {/* Message Overlay */}
                {showOverlay && (
                    <Box sx={{
                        background: 'rgba(0, 0, 0, 0.75)',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        maxWidth: '90%',
                        p: 6,
                        borderRadius: 4,
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                        <Typography variant="h3" sx={{
                            color: '#fff',
                            fontWeight: '700',
                            mb: 1,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            {firstName}
                        </Typography>

                        {/* 1. Climax Message */}
                        {showClimaxMessage && config?.celebration_message && (
                            <Typography variant="h2" sx={{
                                background: 'linear-gradient(45deg, #FFD700, #FDB931)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                fontWeight: '900',
                                mb: 4,
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                lineHeight: 1.1
                            }}>
                                {config.celebration_message}
                            </Typography>
                        )}

                        {/* 2. Special Message */}
                        {showSpecialMessage && config?.special_message && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                {config?.special_message_image_url && (
                                    <Box
                                        component="img"
                                        src={config.special_message_image_url}
                                        alt="Special Event"
                                        sx={{
                                            maxWidth: '200px',
                                            maxHeight: '150px',
                                            borderRadius: 2,
                                            mb: 2,
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                            border: '2px solid rgba(255,255,255,0.2)'
                                        }}
                                    />
                                )}
                                <Typography variant="h5" sx={{
                                    color: config?.special_message_color || 'rgba(255,255,255,0.9)',
                                    fontWeight: '500',
                                    textAlign: 'center',
                                    maxWidth: '800px',
                                    whiteSpace: 'pre-wrap', // Preserve newlines
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                }}>
                                    {config.special_message}
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={() => {
                                if (config?.event_id) {
                                    localStorage.setItem('truthlens_event_completed', config.event_id);
                                    setCurrentState('LOCKED');
                                }
                            }}
                            sx={{ minWidth: 150, borderRadius: 3 }}
                        >
                            Dismiss
                        </Button>
                    </Box>
                )}
            </Box>

            <style jsx global>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .snowflake {
                    color: #fff;
                    font-size: 1em;
                    font-family: Arial;
                    text-shadow: 0 0 1px #000;
                    position: fixed;
                    top: -10%;
                    z-index: 9999;
                    user-select: none;
                    cursor: default;
                    animation-name: snowflakes-fall, snowflakes-shake;
                    animation-duration: 10s, 3s;
                    animation-timing-function: linear, ease-in-out;
                    animation-iteration-count: infinite, infinite;
                    animation-play-state: running, running;
                }
                @keyframes snowflakes-fall {
                    0% { top: -10%; }
                    100% { top: 100%; }
                }
                @keyframes snowflakes-shake {
                    0% { transform: translateX(0px); }
                    50% { transform: translateX(80px); }
                    100% { transform: translateX(0px); }
                }
            `}</style>
        </Box>
    );
}

// --- "PRO" HIGH-END EFFECTS ---

function SnowEffect() {
    // Generate flakes with depth properties (size, blur, speed)
    const flakes = useMemo(() => new Array(75).fill(0).map((_, i) => {
        const depth = Math.random(); // 0 = far, 1 = near
        return {
            left: Math.random() * 100 + '%',
            animationDelay: -Math.random() * 10 + 's',
            animationDuration: (Math.random() * 5 + 5) + 's', // 5-10s
            size: (Math.random() * 5 + 3) + 'px',
            blur: (1 - depth) * 2 + 'px', // Far items are blurrier
            opacity: (0.3 + depth * 0.7), // Near items are brighter
        };
    }), []);

    return (
        <React.Fragment>
            <style jsx global>{`
                .snowflake {
                    position: fixed;
                    top: -20px;
                    background: white;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    animation: snow-fall linear infinite, snow-sway ease-in-out infinite alternate;
                }
                @keyframes snow-fall {
                    0% { transform: translateY(-20px); }
                    100% { transform: translateY(105vh); }
                }
                @keyframes snow-sway {
                    0% { transform: translateX(-15px); }
                    100% { transform: translateX(15px); }
                }
            `}</style>
            {flakes.map((flake, i) => (
                <div key={i} className="snowflake" style={{
                    left: flake.left,
                    width: flake.size,
                    height: flake.size,
                    filter: `blur(${flake.blur})`,
                    opacity: flake.opacity,
                    animationDuration: `${flake.animationDuration}, ${parseFloat(flake.animationDuration) / 2}s`,
                    animationDelay: flake.animationDelay,
                    boxShadow: '0 0 5px rgba(255,255,255,0.8)' // Glow
                }} />
            ))}
        </React.Fragment>
    )
}

function RainEffect() {
    // Multi-layer rain for parallax depth
    const drops = useMemo(() => new Array(120).fill(0).map((_, i) => ({
        left: Math.random() * 100 + '%',
        animationDelay: -Math.random() * 2 + 's',
        animationDuration: (0.5 + Math.random() * 0.5) + 's', // Fast! 0.5-1s
        opacity: 0.2 + Math.random() * 0.3,
        height: (10 + Math.random() * 15) + 'px'
    })), []);

    return (
        <React.Fragment>
            <style jsx global>{`
                .raindrop {
                    position: fixed;
                    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(174, 194, 224, 0.8));
                    width: 1.5px;
                    top: -50px;
                    pointer-events: none;
                    z-index: 9999;
                    animation: rain-fall linear infinite;
                }
                @keyframes rain-fall {
                    0% { transform: translateY(-50px) translateX(0px); }
                    100% { transform: translateY(110vh) translateX(-20px); } /* Slight wind slant */
                }
            `}</style>
            {drops.map((drop, i) => (
                <div key={i} className="raindrop" style={{
                    left: drop.left,
                    height: drop.height,
                    opacity: drop.opacity,
                    animationDuration: drop.animationDuration,
                    animationDelay: drop.animationDelay
                }} />
            ))}
        </React.Fragment>
    )
}

function LeavesEffect() {
    // "Spring Atmosphere" - Gentle Sakura & Fresh Leaves
    // Physics: Floating, drifting, soft swaying (feathery) instead of heavy tumbling
    const particles = useMemo(() => new Array(40).fill(0).map((_, i) => ({
        left: Math.random() * 100 + '%',
        animationDelay: -Math.random() * 10 + 's',
        animationDuration: (10 + Math.random() * 8) + 's', // Slower, graceful fall
        size: (15 + Math.random() * 15) + 'px',
        type: Math.random() > 0.4 ? '🌸' : '🍃', // Mostly flowers, some fresh leaves
        rotationAxis: Math.random() > 0.5 ? 'X' : 'Y', // Random spin axis
        swayDuration: (3 + Math.random() * 3) + 's'
    })), []);

    return (
        <React.Fragment>
            <style jsx global>{`
                .spring-particle {
                    position: fixed;
                    top: -10%;
                    pointer-events: none;
                    z-index: 9999;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); /* Soft shadow */
                    animation-timing-function: linear, ease-in-out;
                    animation-iteration-count: infinite, infinite;
                    animation-name: spring-fall, spring-sway;
                }
                @keyframes spring-fall {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                @keyframes spring-sway {
                    0% { transform: translateX(0) rotate3d(1, 1, 1, 0deg); }
                    25% { transform: translateX(30px) rotate3d(1, 1, 1, 45deg); }
                    50% { transform: translateX(0) rotate3d(1, 1, 1, 90deg); }
                    75% { transform: translateX(-30px) rotate3d(1, 1, 1, 135deg); }
                    100% { transform: translateX(0) rotate3d(1, 1, 1, 180deg); }
                }
            `}</style>
            {particles.map((p, i) => (
                <div key={i} className="spring-particle" style={{
                    left: p.left,
                    fontSize: p.size,
                    animationDuration: `${p.animationDuration}, ${p.swayDuration}`,
                    animationDelay: p.animationDelay
                }}>
                    {p.type}
                </div>
            ))}
        </React.Fragment>
    )
}

function ChristmasEffect() {
    // "Polar Express" Atmosphere
    // Rich mix of icons: Trees, Santa, Gifts, Stars, Bells
    const particles = useMemo(() => new Array(50).fill(0).map((_, i) => {
        const types = ['🎄', '🎅', '🎁', '⭐', '🦌', '🔔', '🍪'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            left: Math.random() * 100 + '%',
            animationDelay: -Math.random() * 15 + 's',
            animationDuration: (6 + Math.random() * 8) + 's',
            size: (20 + Math.random() * 20) + 'px',
            type,
            rotationDir: Math.random() > 0.5 ? 1 : -1,
            swayDuration: (3 + Math.random() * 4) + 's'
        };
    }), []);

    return (
        <React.Fragment>
            <style jsx global>{`
                .christmas-item {
                    position: fixed;
                    top: -50px;
                    pointer-events: none;
                    z-index: 9999;
                    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); /* Golden Glow */
                    animation-timing-function: linear, ease-in-out;
                    animation-iteration-count: infinite, infinite;
                    animation-name: xmas-fall, xmas-sway;
                }
                @keyframes xmas-fall {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                @keyframes xmas-sway {
                    0% { transform: translateX(0) rotate(0deg); }
                    100% { transform: translateX(20px) rotate(20deg); } /* Gentle wobble */
                }
            `}</style>
            {particles.map((p, i) => (
                <div key={i} className="christmas-item" style={{
                    left: p.left,
                    fontSize: p.size,
                    animationDuration: `${p.animationDuration}, ${p.swayDuration}`,
                    animationDelay: p.animationDelay
                }}>
                    {p.type}
                </div>
            ))}
        </React.Fragment>
    )
}
