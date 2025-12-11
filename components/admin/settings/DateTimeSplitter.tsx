import React, { useEffect, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface DateTimeSplitterProps {
    label: string; // e.g. "Theme Start"
    value: string; // ISO UTC String
    onChange: (isoString: string) => void;
    helperText?: string;
}

export default function DateTimeSplitter({ label, value, onChange, helperText }: DateTimeSplitterProps) {
    // Local state for inputs
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');

    useEffect(() => {
        if (value) {
            try {
                // Convert UTC ISO to Local for editing inputs
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    // YYYY-MM-DD
                    const isoLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
                    setDatePart(isoLocal.slice(0, 10));
                    setTimePart(isoLocal.slice(11, 16));
                }
            } catch (e) {
                console.error("Invalid date parse", e);
            }
        }
    }, [value]);

    const handleUpdate = (d: string, t: string) => {
        if (d && t) {
            // Combine Local Date + Time -> UTC ISO
            const localDate = new Date(`${d}T${t}:00`);
            onChange(localDate.toISOString());
        }
        if (d) setDatePart(d);
        if (t) setTimePart(t);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    type="date"
                    label={`${label.replace('Start', '').replace('End', '').trim()} Date`} // Intelligent short label? Or just "Date"
                    // Actually, simpler: Use the full label context if possible, or just "Date"
                    // Let's use the provided label + "Date" for clarity, but keep it tight.
                    // If label is "Theme Start", result "Theme Start Date" is long.
                    // Let's try to put the main label on the first input and "Time" on the second?
                    // Better: "Date" and "Time" but put the main label as a hidden legend?
                    // No, users need to know WHAT date.
                    label={`${label} Date`}
                    fullWidth
                    value={datePart}
                    onChange={(e) => handleUpdate(e.target.value, timePart)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    type="time"
                    label="Time"
                    fullWidth
                    value={timePart}
                    onChange={(e) => handleUpdate(datePart, e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>
            {helperText && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', ml: 1 }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    );
}
