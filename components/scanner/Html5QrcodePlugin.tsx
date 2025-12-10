'use client';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

const qrcodeRegionId = "html5qr-code-full-region";

interface Html5QrcodePluginProps {
    fps?: number;
    qrbox?: number;
    aspectRatio?: number;
    disableFlip?: boolean;
    verbose?: boolean;
    qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void;
    qrCodeErrorCallback?: (errorMessage: string) => void;
}

export default function Html5QrcodePlugin(props: Html5QrcodePluginProps) {

    // State
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    // Configuration
    const config = {
        fps: props.fps || 15,
        qrbox: {
            width: Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.8 : 300, 350),
            height: 200
        },
        // aspectRatio: undefined, // Native
        disableFlip: props.disableFlip || false,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
        ]
    };

    const startScanner = async () => {
        if (!scannerRef.current) return;

        // Check for HTTPS
        if (typeof window !== "undefined" && !window.isSecureContext) {
            setError("Camera requires HTTPS (or localhost). It will not work on HTTP.");
            return;
        }

        try {
            setError(null);
            await scannerRef.current.start(
                {
                    facingMode: "environment",
                    // @ts-ignore
                    focusMode: "continuous"
                },
                config,
                (decodedText, decodedResult) => {
                    props.qrCodeSuccessCallback(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Ignore frame errors
                }
            );
            setHasPermission(true);
        } catch (err: any) {
            console.error("Error starting camera:", err);
            setError(`Camera Error: ${err?.message || "Permission denied"}`);
        }
    };

    useEffect(() => {
        // Initialize
        const html5QrCode = new Html5Qrcode(qrcodeRegionId);
        scannerRef.current = html5QrCode;

        // Auto-start
        const timer = setTimeout(() => {
            startScanner();
        }, 500);

        return () => {
            clearTimeout(timer);
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => console.error("Error stopping scanner", err));
            } else {
                html5QrCode.clear();
            }
        };
    }, []);

    return (
        <Box
            id={qrcodeRegionId}
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                bgcolor: 'black',
                '& video': {
                    objectFit: 'cover',
                    height: '100% !important',
                    width: '100% !important',
                    borderRadius: '0 !important'
                }
            }}
        >
            {error && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'white',
                    width: '80%',
                    zIndex: 20
                }}>
                    <Typography color="error" variant="h6" gutterBottom>
                        {error}
                    </Typography>

                    {/* Manual Retry Button - Triggers User Gesture */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={startScanner}
                        sx={{ mt: 2 }}
                    >
                        Start Camera
                    </Button>
                </Box>
            )}
        </Box>
    );
}

