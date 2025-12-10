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
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // Initialize Scanner Instance with verbose logging for debugging
        const html5QrCode = new Html5Qrcode(qrcodeRegionId);
        scannerRef.current = html5QrCode;

        const config = {
            fps: props.fps || 15, // Increased FPS for faster scanning
            qrbox: props.qrbox || 280, // Slightly larger box
            aspectRatio: props.aspectRatio || 1.0,
            disableFlip: props.disableFlip || false,
            // Key Optimization: Use native BarcodeDetector if available (Android/Chrome)
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

        // Start Camera Automatically
        const startScanner = async () => {
            try {
                // Direct start - lets the browser handle permissions and selection
                // This is more robust than getCameras() on some mobile devices
                await html5QrCode.start(
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
                // Show the actual error message from the browser
                setError(`Camera Error: ${err?.message || "Permission denied"}`);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 500);

        // Cleanup
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
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 2 }}
                    >
                        Retry Camera
                    </Button>
                </Box>
            )}
        </Box>
    );
}
