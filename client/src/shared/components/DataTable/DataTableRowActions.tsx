import React from "react";
import { Button, HStack, Icon } from "@chakra-ui/react";
import { MdDelete, MdEdit } from "react-icons/md";

export interface DataTableRowActionsProps {
    onEdit?: () => void;
    onDelete?: () => void;
}

export const DataTableRowActions: React.FC<DataTableRowActionsProps> = ({
    onEdit,
    onDelete,
}) => {
    return (
        <HStack gap={1.5} justify="flex-end">
            {onEdit && (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size="sm"
                    onClick={onEdit}
                >
                    <Icon color="card_action_icon_primary">
                        <MdEdit />
                    </Icon>
                </Button>
            )}
            {onDelete && (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size="sm"
                    onClick={onDelete}
                >
                    <Icon color="card_action_icon_danger">
                        <MdDelete />
                    </Icon>
                </Button>
            )}
        </HStack>
    );
};

export default DataTableRowActions;
