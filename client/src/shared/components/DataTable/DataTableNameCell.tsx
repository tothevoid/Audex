import React from "react";
import { HStack, Text } from "@chakra-ui/react";
import StoredIcon from "@/shared/components/StoredIcon";
import { Nullable } from "@/shared/utilities/nullable";

export interface DataTableNameCellProps {
    name: string;
    iconSrc?: Nullable<string>;
    fallbackIcon?: React.ReactNode;
}

export const DataTableNameCell: React.FC<DataTableNameCellProps> = ({
    name,
    iconSrc,
    fallbackIcon,
}) => {
    const hasIcon = iconSrc !== undefined || fallbackIcon !== undefined;

    if (!hasIcon) {
        return <Text fontWeight="medium">{name}</Text>;
    }

    return (
        <HStack gap={3}>
            <StoredIcon
                src={iconSrc}
                fallbackIcon={fallbackIcon}
                size="sm"
                shape="rounded"
                alt={name}
            />
            <Text fontWeight="medium">{name}</Text>
        </HStack>
    );
};

export default DataTableNameCell;
