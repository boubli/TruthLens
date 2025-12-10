'use client';

import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

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
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // cleanup previous instance if exists
        if (scannerRef.current) {
            scannerRef.current.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        }

        const config = {
            fps: props.fps || 10,
            qrbox: props.qrbox || 250,
            aspectRatio: props.aspectRatio,
            disableFlip: props.disableFlip || false,
            videoConstraints: {
                facingMode: "environment"
            },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };

        const verbose = props.verbose === true;

        // Initialize Scanner
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId,
            config,
            verbose
        );
        scannerRef.current = html5QrcodeScanner;

        html5QrcodeScanner.render(
            props.qrCodeSuccessCallback,
            props.qrCodeErrorCallback
        );

        // Cleanup function
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []); // Empty dependency array to run once on mount

    return (
        <Box
            id={qrcodeRegionId}
            sx={{
                width: '100%',
                height: '100%',
                '& video': {
                    objectFit: 'cover',
                    height: '100% !important'
                },
                '& #html5qr-code-full-region__scan_region': {
                    height: '100% !important'
                },
                '& img': {
                    display: 'none' // Hide info icon
                },
                '& a': {
                    display: 'none' // Hide info link
                }
            }}
        />
    );
}
