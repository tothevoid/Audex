import React from 'react';
import { IconButton, IconButtonProps } from '@chakra-ui/react';
import { MdPieChart } from 'react-icons/md';

export interface AnalyticsButtonProps extends Omit<IconButtonProps, 'aria-label' | 'onClick'> {
    isOpen: boolean;
    onToggle: () => void;
    title?: string;
    size?: IconButtonProps['size'];
}

export const AnalyticsButton: React.FC<AnalyticsButtonProps> = ({
    isOpen,
    onToggle,
    title,
    size = 'sm',
    ...rest
}) => {
    return (
        <IconButton
            size={size}
            variant={isOpen ? 'solid' : 'outline'}
            onClick={onToggle}
            title={title}
            aria-label={title || 'Analytics'}
            borderRadius="lg"
            {...rest}
        >
            <MdPieChart size={18} />
        </IconButton>
    );
};

export default AnalyticsButton;
