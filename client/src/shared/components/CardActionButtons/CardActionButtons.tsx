import React from 'react';
import { Button, HStack, Icon } from '@chakra-ui/react';
import { MdCompareArrows, MdContentCopy, MdDelete, MdEdit, MdSettings, MdUndo } from 'react-icons/md';

export interface CardActionButtonProps {
    size?: 'xs' | 'sm' | 'md';
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    iconColor?: string;
    hoverBg?: string;
    hoverBorderColor?: string;
    title?: string;
    visibility?: 'visible' | 'hidden';
    pointerEvents?: 'auto' | 'none';
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
    size = 'xs',
    icon,
    onClick,
    iconColor = 'card_action_icon_primary',
    hoverBg = 'background_primary',
    hoverBorderColor = 'border_primary',
    title,
    visibility,
    pointerEvents,
}) => (
    <Button
        size={size}
        variant="subtle"
        bg="button_background_secondary"
        borderColor="border_primary"
        borderWidth="1px"
        title={title}
        visibility={visibility}
        pointerEvents={pointerEvents}
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
    transferTitle?: string;
    onUndo?: (e: React.MouseEvent) => void;
    undoTitle?: string;
    undoColor?: string;
    undoVisible?: boolean;
    onCopy?: (e: React.MouseEvent) => void;
    copyTitle?: string;
    onSettings?: (e: React.MouseEvent) => void;
    settingsTitle?: string;
    onEdit?: (e: React.MouseEvent) => void;
    editTitle?: string;
    onDelete?: (e: React.MouseEvent) => void;
    deleteTitle?: string;
    customActions?: CardActionButtonCustomAction[];
}

export const CardActionButtons: React.FC<CardActionButtonsProps> = ({
    size = 'xs',
    onTransfer,
    transferTitle,
    onUndo,
    undoTitle,
    undoColor,
    undoVisible,
    onCopy,
    copyTitle,
    onSettings,
    settingsTitle,
    onEdit,
    editTitle,
    onDelete,
    deleteTitle,
    customActions,
}) => {
    return (
        <HStack gap={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            {onUndo && (
                <CardActionButton
                    size={size}
                    icon={<MdUndo />}
                    onClick={onUndo}
                    iconColor={undoColor ?? 'yellow.500'}
                    title={undoTitle}
                    visibility={undoVisible === false ? 'hidden' : undefined}
                    pointerEvents={undoVisible === false ? 'none' : undefined}
                />
            )}
            {onTransfer && (
                <CardActionButton
                    size={size}
                    icon={<MdCompareArrows />}
                    onClick={onTransfer}
                    title={transferTitle}
                />
            )}
            {onCopy && (
                <CardActionButton
                    size={size}
                    icon={<MdContentCopy />}
                    onClick={onCopy}
                    title={copyTitle}
                />
            )}
            {onSettings && (
                <CardActionButton
                    size={size}
                    icon={<MdSettings />}
                    onClick={onSettings}
                    title={settingsTitle}
                />
            )}
            {onEdit && (
                <CardActionButton
                    size={size}
                    icon={<MdEdit />}
                    onClick={onEdit}
                    title={editTitle}
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
                    title={deleteTitle}
                />
            )}
        </HStack>
    );
};

export default CardActionButtons;
