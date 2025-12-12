import React, { useState, useEffect } from 'react';
import { Card, CardMedia, CardContent, Typography, Chip, Box, Button, CardActions, IconButton } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AddToCompareButton from '@/components/compare/AddToCompareButton';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '@/services/favoriteService';

interface ProductCardProps {
    id: string | number;
    name: string;
    image: string; // URL
    description: string;
    grade: string;
    searchQuery?: string; // For passing context to product page (AI Hydration)
}

const ProductCard: React.FC<ProductCardProps> = ({ id, name, image, description, grade, searchQuery }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loadingFav, setLoadingFav] = useState(false);

    useEffect(() => {
        if (user) {
            checkIsFavorite(user.uid, String(id)).then(setIsFavorite);
        }
    }, [user, id]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }
        setLoadingFav(true);
        try {
            if (isFavorite) {
                await removeFromFavorites(user.uid, String(id));
                setIsFavorite(false);
            } else {
                await addToFavorites(user.uid, {
                    id: String(id),
                    product_name: name,
                    image_front_small_url: image, // mapping needed for service
                    brands: 'Unknown', // Basic info
                    // We construct a minimal object for the service
                });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Failed to toggle favorite', error);
        } finally {
            setLoadingFav(false);
        }
    };

    const getGradeColor = (g: string) => {
        if (g === 'A' || g === 'B') return 'success';
        if (g === 'C') return 'warning';
        return 'error';
    };

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            borderRadius: 3,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
            }
        }}>
            <Chip
                label={`Grade ${grade}`}
                color={getGradeColor(grade)}
                size="small"
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1
                }}
            />
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: '#f8f9fa' }}>
                <CardMedia
                    component="img"
                    image={image || "https://via.placeholder.com/300?text=Product"}
                    alt={name}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 2
                    }}
                />
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 1.5, pb: '0 !important' }}>
                <Typography gutterBottom variant="subtitle2" component="div" fontWeight="bold" sx={{
                    lineHeight: 1.2,
                    mb: 0.5,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    height: '2.4em',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    lineHeight: 1.4
                }}>
                    {description}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', px: 1.5, py: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={handleToggleFavorite}
                        color={isFavorite ? 'error' : 'default'}
                        disabled={loadingFav}
                        sx={{ bgcolor: isFavorite ? 'rgba(211, 47, 47, 0.05)' : 'transparent' }}
                    >
                        {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </IconButton>
                    <AddToCompareButton product={{
                        id: String(id),
                        name,
                        image,
                        description,
                        nutrition_grades: grade,
                        brand: 'Unknown',
                        ingredients: [],
                        nutriments: {}
                    }} />
                </Box>
                <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                        const url = searchQuery
                            ? `/product/${id}?source=dashboard&q=${encodeURIComponent(searchQuery)}`
                            : `/product/${id}`;
                        router.push(url);
                    }}
                    sx={{
                        borderRadius: 4,
                        textTransform: 'none',
                        boxShadow: 'none',
                        fontSize: '0.8rem',
                        px: 2,
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark', boxShadow: '0 2px 8px rgba(108, 99, 255, 0.3)' }
                    }}
                >
                    Details
                </Button>
            </CardActions>
        </Card>
    );
};

export default ProductCard;
