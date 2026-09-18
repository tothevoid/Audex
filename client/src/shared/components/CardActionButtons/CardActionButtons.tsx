import React from 'react';
import { Button, HStack, Icon } from '@chakra-ui/react';
import { MdCompareArrows, MdContentCopy, MdDelete, MdEdit, MdSettings } from 'react-icons/md';

export interface CardActionButtonProps {
    size?: 'xs' | 'sm' | 'md';
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    iconColor?: string;
    hoverBg?: string;
    hoverBorderColor?: string;
    title?: string;
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
    size = 'xs',
    icon,
    onClick,
    iconColor = 'card_action_icon_primary',
    hoverBg = 'background_primary',
    hoverBorderColor = 'border_primary',
    title,
}) => (
    <Button
        size={size}
        variant="subtle"
        bg="button_background_secondary"
        borderColor="border_primary"
        borderWidth="1px"
        title={title}
        _hover={{ bg: hoverBg, borderColor: hoverBorderColor }}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
        }}
    >
        <Icon color={iconColor} size={size}>
            {icon}
        </Icon>
    </Button>
);

export interface CardActionButtonCustomAction {
    key: string;
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    color?: string;
    hoverBg?: string;
    hoverBorderColor?: string;
    title?: string;
}

export interface CardActionButtonsProps {
    size?: 'xs' | 'sm' | 'md';
    onTransfer?: (e: React.MouseEvent) => void;
    onCopy?: (e: React.MouseEvent) => void;
    onSettings?: (e: React.MouseEvent) => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    customActions?: CardActionButtonCustomAction[];
}

export const CardActionButtons: React.FC<CardActionButtonsProps> = ({
    size = 'xs',
    onTransfer,
    onCopy,
    onSettings,
    onEdit,
    onDelete,
    customActions,
}) => {
    return (
        <HStack gap={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            {onTransfer && (
                <CardActionButton
                    size={size}
                    icon={<MdCompareArrows />}
                    onClick={onTransfer}
                />
            )}
            {onCopy && (
                <CardActionButton
                    size={size}
                    icon={<MdContentCopy />}
                    onClick={onCopy}
                />
            )}
            {onSettings && (
                <CardActionButton
                    size={size}
                    icon={<MdSettings />}
                    onClick={onSettings}
                />
            )}
            {onEdit && (
                <CardActionButton
                    size={size}
                    icon={<MdEdit />}
                    onClick={onEdit}
                />
            )}
            {customActions?.map((action) => (
                <CardActionButton
                    key={action.key}
                    size={size}
                    icon={action.icon}
                    onClick={action.onClick}
                    iconColor={action.color}
                    hoverBg={action.hoverBg}
                    hoverBorderColor={action.hoverBorderColor}
                    title={action.title}
                />
            ))}
            {onDelete && (
                <CardActionButton
                    size={size}
                    icon={<MdDelete />}
                    onClick={onDelete}
                    iconColor="card_action_icon_danger"
                    hoverBg="rgba(220, 38, 38, 0.2)"
                    hoverBorderColor="rgba(220, 38, 38, 0.5)"
                />
            )}
        </HStack>
    );
};

export default CardActionButtons;
