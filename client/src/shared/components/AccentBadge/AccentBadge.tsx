import React from 'react';
import { Badge, BadgeProps } from '@chakra-ui/react';

export type AccentBadgeVariant = 'success' | 'danger' | 'info' | 'neutral' | 'primary';

export interface AccentBadgeProps extends Omit<BadgeProps, 'variant'> {
    variant?: AccentBadgeVariant;
    children: React.ReactNode;
}

export const AccentBadge: React.FC<AccentBadgeProps> = ({
    variant = 'success',
    children,
    size = 'md',
    borderRadius = 'md',
    px = 3,
    py = 1,
    fontSize = 'xs',
    fontWeight = '600',
    borderWidth = '1px',
    ...rest
}) => {
    const variantStyles: Record<AccentBadgeVariant, { bg: string; color: string; borderColor: string }> = {
        success: {
            bg: 'status_success_bg',
            color: 'status_success',
            borderColor: 'status_success_border',
        },
        danger: {
            bg: 'status_danger_bg',
            color: 'status_danger',
            borderColor: 'status_danger_border',
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.12)',
            color: 'blue.400',
            borderColor: 'rgba(59, 130, 246, 0.3)',
        },
        neutral: {
            bg: 'background_secondary',
            color: 'text_secondary',
            borderColor: 'border_primary',
        },
        primary: {
            bg: 'rgba(10, 142, 58, 0.12)',
            color: 'action_primary',
            borderColor: 'rgba(10, 142, 58, 0.3)',
        },
    };

    const styles = variantStyles[variant];

    return (
        <Badge
            size={size}
            bg={styles.bg}
            color={styles.color}
            borderColor={styles.borderColor}
            borderWidth={borderWidth}
            borderRadius={borderRadius}
            px={px}
            py={py}
            fontSize={fontSize}
            fontWeight={fontWeight}
            {...rest}
        >
            {children}
        </Badge>
    );
};

export default AccentBadge;
