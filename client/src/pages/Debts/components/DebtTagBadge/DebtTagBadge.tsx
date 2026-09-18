import React from "react";
import { Badge, BadgeProps } from "@chakra-ui/react";
import { useColorMode } from "../../../../shared/context/ColorModeContext";
import { getAccessibleTagStyles } from "../../../../shared/utilities/colorUtilities";

export interface DebtTagBadgeProps extends Omit<BadgeProps, "name"> {
    name: string;
    colorHex?: string;
    isSelected?: boolean;
}

export const DebtTagBadge: React.FC<DebtTagBadgeProps> = ({
    name,
    colorHex,
    isSelected,
    px = 2.5,
    py = 0.5,
    borderRadius = "full",
    fontSize = "xs",
    fontWeight,
    children,
    style,
    ...restProps
}) => {
    const { resolvedColorMode } = useColorMode();
    const tagStyles = getAccessibleTagStyles(colorHex, resolvedColorMode, isSelected);

    const defaultFontWeight = fontWeight || (isSelected !== undefined ? (isSelected ? "bold" : "semibold") : "semibold");

    return (
        <Badge
            variant="plain"
            style={{
                backgroundColor: tagStyles.bg,
                color: tagStyles.color,
                border: tagStyles.border,
                outline: tagStyles.outline,
                transition: "all 0.15s ease",
                ...style,
            }}
            px={px}
            py={py}
            borderRadius={borderRadius}
            fontSize={fontSize}
            fontWeight={defaultFontWeight}
            {...restProps}
        >
            {name}
            {children}
        </Badge>
    );
};

export default DebtTagBadge;
