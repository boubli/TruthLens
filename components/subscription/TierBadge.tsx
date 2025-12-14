/**
 * Tier Badge Component
 * Displays user subscription tier with appropriate styling
 */

'use client';

import { Chip, ChipProps } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SpeedIcon from '@mui/icons-material/Speed';
import { UserTier } from '@/types/user';

interface TierBadgeProps extends Omit<ChipProps, 'color'> {
    tier: UserTier;
}

export default function TierBadge({ tier, sx, ...props }: TierBadgeProps) {
    let icon = undefined;
    let label = 'FREE';
    let color: ChipProps['color'] = 'default';
    let gradient = undefined;

    switch (tier) {
        case 'plus':
            label = 'PLUS';
            icon = <SpeedIcon />;
            color = 'info';
            gradient = 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)';
            break;
        case 'pro':
            label = 'PRO';
            icon = <StarIcon />;
            color = 'warning';
            gradient = 'linear-gradient(45deg, #FCD34D 30%, #FB923C 90%)';
            break;
        case 'ultimate':
            label = 'ULTIMATE';
            icon = <DiamondIcon />;
            color = 'secondary'; // or 'error'/purple custom
            gradient = 'linear-gradient(45deg, #8B5CF6 30%, #EC4899 90%)';
            break;
        default: // free
            label = 'FREE';
            color = 'default';
            break;
    }

    return (
        <Chip
            icon={icon}
            label={label}
            color={color}
            variant="filled"
            sx={{
                fontWeight: 'bold',
                ...(tier !== 'free' && {
                    background: gradient,
                    border: 'none',
                    color: 'white',
                    '& .MuiChip-icon': {
                        color: 'inherit'
                    }
                }),
                ...sx,
            }}
            {...props}
        />
    );
}
