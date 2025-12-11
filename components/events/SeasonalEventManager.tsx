'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEventConfigFromApi } from '@/services/systemService';
import { EventManagerConfig } from '@/types/system';
import Lottie from 'lottie-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Box, Typography, Button, IconButton } from '@mui/material';

// Placeholder for verified Fireworks Lottie JSON URL
const FIREWORKS_LOTTIE_URL = "https://lottie.host/88af9b8a-1317-4860-9118-4903e670ca10/valid-fireworks.json";

// Time Sync Constants
const SYNC_INTERVAL = 1000 * 60 * 10; // 10 minutes
const TICK_RATE = 1000; // 1 second update loop

type EventState = 'IDLE' | 'THEME_ACTIVE' | 'CELEBRATION' | 'LOCKED';

export default function SeasonalEventManager() {
    const { user, loading } = useAuth();
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
            if (result && result.config) {
                setConfig(result.config);
                // Calculate Offset: ServerTime - (LocalTimeNow - Latency)
                const serverTimeMs = new Date(result.server_time).getTime() + result.latency;
                const localTimeMs = Date.now();
                const offset = serverTimeMs - localTimeMs;
                setTimeOffset(offset);
                console.log('[EventManager] Synced. Offset:', offset, 'ms');
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
        if (!config || !config.is_active_global || !user) return;

        const loop = setInterval(() => {
            const now = Date.now() + timeOffset; // Current Server Time

            // --- TIME WINDOW CHECKS ---
            const themeStart = new Date(config.general_theme_start).getTime();
            const themeEnd = new Date(config.general_theme_end).getTime();

            const musicStart = new Date(config.celebration_music_start).getTime();
            const musicEnd = new Date(config.celebration_music_end).getTime();

            const fireStart = config.celebration_climax_start
                ? new Date(config.celebration_climax_start).getTime()
                : musicStart + (10 * 60 * 1000);

            // Check Lock
            const lockedEventId = localStorage.getItem('truthlens_event_completed');
            if (lockedEventId === config.event_id) {
                setCurrentState('LOCKED');
                return;
            }

            // Global Window Check
            if (now < themeStart || now > themeEnd) {
                setCurrentState('IDLE');
                return;
            }

            // --- INDEPENDENT LOGIC BRANCHES ---

            // 1. Music Logic (Looping)
            const shouldPlayMusic = (now >= musicStart && now < musicEnd);

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
            const isFireActive = (now >= fireStart && now < musicEnd);

            if (secondsUntilFire > 0 && secondsUntilFire <= config.countdown_seconds) {
                currentCount = Math.ceil(secondsUntilFire);
            } else if (secondsUntilFire <= 0 && isFireActive) {
                currentCount = 0;
            }

            // --- STATE UPDATES ---
            const isPostEvent = (now >= musicEnd && now < themeEnd);

            if (isFireActive || currentCount !== null || isPostEvent) {
                setCurrentState('CELEBRATION');
            } else {
                setCurrentState('THEME_ACTIVE');
            }

            setCountdown(currentCount);

        }, TICK_RATE);

        return () => clearInterval(loop);
    }, [config, timeOffset, user, fireworksData]);


    // RENDERERS

    if (loading || !user || !config || !config.is_active_global || currentState === 'IDLE' || currentState === 'LOCKED') {
        return null;
    }

    // Derived Render State (Frame Perfect)
    const now = Date.now() + timeOffset;

    // Explicit Independent Time Windows
    const themeStart = new Date(config.general_theme_start).getTime();
    const themeEnd = new Date(config.general_theme_end).getTime();
    const isThemeActive = (now >= themeStart && now < themeEnd);

    const musicEnd = new Date(config.celebration_music_end).getTime();
    const fireStart = config.celebration_climax_start ? new Date(config.celebration_climax_start).getTime() : 0;
    const isFireActive = (now >= fireStart && now < musicEnd);

    const showMessage = (now >= fireStart && now < themeEnd);

    // Render Logic using specific fields
    const themeEffect = config.theme_effect || 'snow_cold';
    const climaxEffect = config.climax_effect || 'fireworks';

    const firstName = user.displayName ? user.displayName.split(' ')[0] : (user.email?.split('@')[0] || 'Friend');

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
            {config.music_file_url && (
                <audio ref={audioRef} src={config.music_file_url} preload="auto" loop={true} />
            )}

            {/* THEME: SNOW (Strictly Independent - Phase A) */}
            {isThemeActive && themeEffect === 'snow_cold' && (
                <SnowEffect />
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

                {/* Message (Personalized) */}
                {showMessage && (
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

                        {/* Special Message Sub-Header */}
                        {config.special_message && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                {config.special_message_image_url && (
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
                                    color: config.special_message_color || 'rgba(255,255,255,0.9)',
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
                                localStorage.setItem('truthlens_event_completed', config.event_id);
                                setCurrentState('LOCKED');
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

// Simple CSS Snow Component to avoid heavy dependencies
function SnowEffect() {
    const flakes = useMemo(() => new Array(50).fill(0).map((_, i) => ({
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 10 + 's, ' + Math.random() * 3 + 's',
        opacity: Math.random()
    })), []);

    return (
        <React.Fragment>
            {flakes.map((flake, i) => (
                <div key={i} className="snowflake" style={{
                    left: flake.left,
                    animationDelay: flake.animationDelay,
                    opacity: flake.opacity
                }}>
                    ❅
                </div>
            ))}
        </React.Fragment>
    )
}
