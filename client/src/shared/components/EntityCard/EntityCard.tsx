import React from 'react';
import { Card, CardRootProps } from '@chakra-ui/react';

export interface EntityCardProps extends CardRootProps {
    children: React.ReactNode;
    isHoverable?: boolean;
    isSelected?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
    children,
    isHoverable = true,
    isSelected = false,
    backgroundColor = "background_primary",
    borderColor,
    borderWidth,
    borderRadius = "xl",
    overflow = "hidden",
    position = "relative",
    transition = "all 0.2s ease-in-out",
    _hover,
    ...rest
}) => {
    const computedBorderColor = borderColor || (isSelected ? "action_primary" : "border_primary");
    const computedBorderWidth = borderWidth || (isSelected ? "2px" : "1px");

    const hoverStyles = isHoverable
        ? {
            transform: "translateY(-2px)",
            boxShadow: "lg",
            borderColor: isSelected ? "action_primary" : "rgba(255, 255, 255, 0.18)",
            ..._hover,
        }
        : _hover;

    return (
        <Card.Root
            backgroundColor={backgroundColor}
            borderColor={computedBorderColor}
            borderWidth={computedBorderWidth}
            borderRadius={borderRadius}
            overflow={overflow}
            position={position}
            transition={transition}
            _hover={hoverStyles}
            {...rest}
        >
            {children}
        </Card.Root>
    );
};

export default EntityCard;
