/**
 * Validates file signature (Magic Bytes) to prevent malware masquerading as images/PDFs.
 * 
 * Supported types:
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47
 * - PDF: 25 50 44 46
 * - WEBP: RIFF ... WEBP
 */
export function validateFileSignature(buffer: Buffer): { isValid: boolean; mimeType: string | null } {
    if (!buffer || buffer.length < 4) {
        return { isValid: false, mimeType: null };
    }

    const bytes = buffer.subarray(0, 4).toString('hex').toUpperCase();

    // JPEG (FF D8 FF)
    if (bytes.startsWith('FFD8FF')) {
        return { isValid: true, mimeType: 'image/jpeg' };
    }

    // PNG (89 50 4E 47)
    if (bytes === '89504E47') {
        return { isValid: true, mimeType: 'image/png' };
    }

    // PDF (%PDF -> 25 50 44 46)
    if (bytes === '25504446') {
        return { isValid: true, mimeType: 'application/pdf' };
    }

    // WEBP checks (RIFF....WEBP)
    // RIFF is 52 49 46 46 (bytes 0-3)
    // WEBP is 57 45 42 50 (bytes 8-11)
    if (bytes === '52494646') {
        const subType = buffer.subarray(8, 12).toString('hex').toUpperCase();
        if (subType === '57454250') {
            return { isValid: true, mimeType: 'image/webp' };
        }
    }

    return { isValid: false, mimeType: null };
}
