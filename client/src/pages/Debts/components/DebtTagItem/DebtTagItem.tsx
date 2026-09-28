import React from "react";
import { Flex, Text, IconButton } from "@chakra-ui/react";
import { MdDelete, MdEdit } from "react-icons/md";
import { DebtTagEntity } from "@/models/debts/DebtTagEntity";
import DebtTagBadge from "@/pages/Debts/components/DebtTagBadge/DebtTagBadge";

export interface DebtTagItemProps {
    tag: DebtTagEntity;
    onEdit: () => void;
    onDelete: () => void;
}

export const DebtTagItem: React.FC<DebtTagItemProps> = ({ tag, onEdit, onDelete }) => {
    return (
        <>
            <Flex alignItems="center" gap={2}>
                <DebtTagBadge
                    name={tag.name}
                    colorHex={tag.colorHex}
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontWeight="semibold"
                />
                {tag.usageCount !== undefined && (
                    <Text fontSize="xs" color="gray.500">
                        ({tag.usageCount})
                    </Text>
                )}
            </Flex>
            <Flex gap={1}>
                <IconButton
                    size="xs"
                    variant="ghost"
                    color="text_primary"
                    backgroundColor="transparent"
                    _hover={{ backgroundColor: "background_secondary", color: "action_primary" }}
                    onClick={onEdit}
                >
                    <MdEdit />
                </IconButton>
                <IconButton
                    size="xs"
                    variant="ghost"
                    color="red.500"
                    backgroundColor="transparent"
                    _hover={{ backgroundColor: "background_secondary" }}
                    onClick={onDelete}
                >
                    <MdDelete />
                </IconButton>
            </Flex>
        </>
    );
};

export default DebtTagItem;
