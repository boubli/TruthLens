'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { ActivityData } from '@/services/statsService';

interface ActiveUsersGraphProps {
    data: ActivityData[];
    loading?: boolean;
}

export default function ActiveUsersGraph({ data, loading }: ActiveUsersGraphProps) {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: 0, width: '100%', height: 400, bgcolor: 'transparent' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">User Activity</Typography>
                <Typography variant="body2" color="text.secondary">
                    Daily active users (scans) vs New users
                </Typography>
            </Box>

            <ResponsiveContainer width="100%" height="85%">
                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        dy={10}
                    />
                    <YAxis
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            padding: '12px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active Users"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 0 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="newUsers"
                        name="New Signups"
                        stroke="#93C5FD"
                        strokeWidth={3}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );
}
