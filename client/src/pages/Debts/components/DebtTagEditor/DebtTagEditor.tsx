import React, { useState } from "react";
import { Box, Flex, Input, Button, IconButton } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtTagEntity } from "@/models/debts/DebtTagEntity";
import { MdCheck, MdClose } from "react-icons/md";

interface Props {
    initialName?: string;
    initialColor?: string;
    existingTags: DebtTagEntity[];
    currentTagId?: string;
    submitButtonText: string;
    submitButtonColorPalette?: string;
    onSubmit: (name: string, colorHex: string) => Promise<void>;
    onCancel?: () => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

export const DebtTagEditor: React.FC<Props> = ({
    initialName = "",
    initialColor = "#3182CE",
    existingTags,
    currentTagId,
    submitButtonText,
    submitButtonColorPalette = "green",
    onSubmit,
    onCancel,
    placeholder,
    icon
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialName);
    const [colorHex, setColorHex] = useState(initialColor);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const trimmedName = name.trim();
    const isDuplicate = existingTags.some(
        (tag) => tag.id !== currentTagId && tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    const canSubmit = trimmedName.length > 0 && !isDuplicate;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            await onSubmit(trimmedName, colorHex);
            if (!currentTagId) {
                setName("");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex gap={2} alignItems="center" w="100%">
            <Flex
                flex={1}
                alignItems="center"
                backgroundColor="background_primary"
                borderColor={isDuplicate ? "red.500" : "border_primary"}
                borderWidth="1px"
                borderRadius="md"
                px={3}
                h="36px"
                _focusWithin={{ borderColor: "action_primary" }}
            >
                <Input
                    placeholder={placeholder || t("debt_tag_select_placeholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (canSubmit) handleSubmit();
                        }
                    }}
                    size="sm"
                    color="text_primary"
                    backgroundColor="transparent"
                    border="none"
                    outline="none"
                    boxShadow="none"
                    focusRing="none"
                    _focus={{ backgroundColor: "transparent", border: "none", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                    px={0}
                    h="100%"
                    flex={1}
                />
                <Box display="flex" alignItems="center" pl={2}>
                    <Input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        w="24px"
                        h="24px"
                        p={0}
                        border="none"
                        cursor="pointer"
                        borderRadius="full"
                        backgroundColor="transparent"
                    />
                </Box>
            </Flex>

            <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={isSubmitting}
                colorPalette={submitButtonColorPalette}
                h="36px"
            >
                {icon || <MdCheck />} {submitButtonText}
            </Button>

            {onCancel && (
                <IconButton
                    size="sm"
                    variant="ghost"
                    color="text_primary"
                    backgroundColor="transparent"
                    onClick={onCancel}
                    h="36px"
                    w="36px"
                    _hover={{ backgroundColor: "background_secondary", color: "red.500" }}
                    title={t("modals_cancel_button")}
                >
                    <MdClose />
                </IconButton>
            )}
        </Flex>
    );
};

export default DebtTagEditor;
