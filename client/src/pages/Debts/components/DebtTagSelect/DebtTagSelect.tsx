import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtTagEntity } from "@/models/debts/DebtTagEntity";
import { MdCheck } from "react-icons/md";
import DebtTagBadge from "@/pages/Debts/components/DebtTagBadge/DebtTagBadge";

interface Props {
    availableTags: DebtTagEntity[];
    selectedTags: DebtTagEntity[];
    onChange: (tags: DebtTagEntity[]) => void;
}

const DebtTagSelect: React.FC<Props> = ({ availableTags, selectedTags, onChange }) => {
    const { t } = useTranslation();

    const isSelected = (tagId: string) => selectedTags.some((t) => t.id === tagId);

    const toggleTag = (tag: DebtTagEntity) => {
        if (isSelected(tag.id)) {
            onChange(selectedTags.filter((t) => t.id !== tag.id));
        } else {
            onChange([...selectedTags, tag]);
        }
    };

    return (
        <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
                {t("entity_debt_tags")}
            </Text>

            <Flex wrap="wrap" gap={2} alignItems="center">
                {availableTags.map((tag) => {
                    const selected = isSelected(tag.id);
                    return (
                        <DebtTagBadge
                            key={tag.id}
                            name={tag.name}
                            colorHex={tag.colorHex}
                            isSelected={selected}
                            cursor="pointer"
                            onClick={() => toggleTag(tag)}
                            px={3}
                            py={1}
                        >
                            {selected && (
                                <Flex as="span" alignItems="center" gap={1} ml={1} display="inline-flex">
                                    <MdCheck />
                                </Flex>
                            )}
                        </DebtTagBadge>
                    );
                })}
            </Flex>
        </Box>
    );
};

export default DebtTagSelect;
