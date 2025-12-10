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
        // Initialize Scanner Instance
        const html5QrCode = new Html5Qrcode(qrcodeRegionId);
        scannerRef.current = html5QrCode;

        const config = {
            fps: props.fps || 10,
            qrbox: props.qrbox || 250,
            aspectRatio: props.aspectRatio,
            disableFlip: props.disableFlip || false,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };

        // Start Camera Automatically
        const startScanner = async () => {
            try {
                // Try fetching cameras first to ensure permissions
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    setHasPermission(true);
                    // Use the rear camera (environment)
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        props.qrCodeSuccessCallback,
                        props.qrCodeErrorCallback
                    );
                } else {
                    setError("No cameras found.");
                }
            } catch (err: any) {
                console.error("Error starting camera:", err);
                setError("Camera permission denied or error starting camera.");
            }
        };

        startScanner();

        // Cleanup
        return () => {
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
                '& video': {
                    objectFit: 'cover',
                    height: '100% !important',
                    width: '100% !important'
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
                    width: '80%'
                }}>
                    <Typography color="error" gutterBottom>{error}</Typography>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </Box>
            )}
        </Box>
    );
}
