import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import { LuImage } from 'react-icons/lu';
import { Nullable } from '../../utilities/nullable';

export type StoredIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type StoredIconShape = 'rounded' | 'circle' | 'square';

export interface StoredIconProps {
    src?: Nullable<string>;
    fallbackIcon?: React.ReactNode;
    size?: StoredIconSize;
    shape?: StoredIconShape;
    objectFit?: 'contain' | 'cover';
    alt?: string;
    title?: string;
    bg?: string;
    color?: string;
    border?: string;
}

const sizeConfig: Record<string, { dimension: string; iconSize: number; borderRadius: string }> = {
    xs: { dimension: '16px', iconSize: 12, borderRadius: '4px' },
    sm: { dimension: '24px', iconSize: 14, borderRadius: '4px' },
    md: { dimension: '32px', iconSize: 20, borderRadius: '4px' },
    lg: { dimension: '36px', iconSize: 22, borderRadius: '6px' },
    xl: { dimension: '48px', iconSize: 28, borderRadius: '8px' }
};

export const StoredIcon: React.FC<StoredIconProps> = ({
    src,
    fallbackIcon,
    size = 'md',
    shape = 'rounded',
    objectFit = 'contain',
    alt,
    title,
    bg = 'transparent',
    color = 'text_primary',
    border
}) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    const { dimensionStyle, iconPixelSize, roundedStyle } = useMemo(() => {
        if (typeof size === 'number') {
            const dimension = `${size}px`;
            const borderRadius = shape === 'circle' ? 'full' : shape === 'square' ? '0' : '4px';
            return {
                dimensionStyle: { width: dimension, height: dimension, minWidth: dimension, minHeight: dimension },
                iconPixelSize: Math.round(size * 0.6),
                roundedStyle: borderRadius
            };
        }

        const config = sizeConfig[size] || sizeConfig.md;
        const borderRadius = shape === 'circle' ? 'full' : shape === 'square' ? '0' : config.borderRadius;
        return {
            dimensionStyle: { width: config.dimension, height: config.dimension, minWidth: config.dimension, minHeight: config.dimension },
            iconPixelSize: config.iconSize,
            roundedStyle: borderRadius
        };
    }, [size, shape]);

    const renderFallback = () => {
        return (
            <Flex
                align="center"
                justify="center"
                {...dimensionStyle}
                borderRadius={roundedStyle}
                bg={bg}
                color={color}
                border={border}
                overflow="hidden"
                title={title ?? alt}
                flexShrink={0}
            >
                {fallbackIcon ?? <LuImage size={iconPixelSize} color="var(--chakra-colors-text_secondary)" />}
            </Flex>
        );
    };

    if (!src || hasError) {
        return renderFallback();
    }

    return (
        <Box
            position="relative"
            {...dimensionStyle}
            borderRadius={roundedStyle}
            overflow="hidden"
            bg={bg}
            border={border}
            title={title ?? alt}
            flexShrink={0}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
        >
            <Image
                src={src}
                alt={alt ?? 'icon'}
                fit={objectFit}
                w="100%"
                h="100%"
                borderRadius={roundedStyle}
                onError={() => setHasError(true)}
            />
        </Box>
    );
};

export default StoredIcon;
