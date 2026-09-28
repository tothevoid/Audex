import React, { forwardRef, useState } from "react";
import { Stack, Flex, Text, IconButton, Box } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtTagEntity } from "@/models/debts/DebtTagEntity";
import { updateDebtTag, deleteDebtTag, createDebtTag } from "@/api/debts/debtTagApi";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { MdAdd } from "react-icons/md";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import DebtTagEditor from "@/pages/Debts/components/DebtTagEditor/DebtTagEditor";
import DebtTagItem from "@/pages/Debts/components/DebtTagItem/DebtTagItem";

interface Props {
    tags: DebtTagEntity[];
    onTagsChanged: () => Promise<void>;
}

export const DebtTagManagerModal = forwardRef<BaseModalRef, Props>(({ tags, onTagsChanged }, ref) => {
    const { t } = useTranslation();

    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [deletingTag, setDeletingTag] = useState<DebtTagEntity | null>(null);
    const confirmModalRef = React.useRef<BaseModalRef>(null);

    const handleDeleteRequested = (tag: DebtTagEntity) => {
        setDeletingTag(tag);
        confirmModalRef.current?.openModal();
    };

    const onConfirmDelete = async () => {
        if (deletingTag) {
            await deleteDebtTag(deletingTag.id);
            setDeletingTag(null);
            await onTagsChanged();
        }
    };

    const handleCreateTag = async (name: string, colorHex: string) => {
        await createDebtTag({ name, colorHex });
        setIsAddingTag(false);
        await onTagsChanged();
    };

    const deleteMessage = deletingTag
        ? t("debt_tag_delete_confirm_message", { name: deletingTag.name, count: deletingTag.usageCount ?? 0 })
        : "";

    const headerExtra = !isAddingTag && (
        <IconButton
            size="xs"
            backgroundColor="action_primary"
            color="white"
            _hover={{ opacity: 0.9 }}
            onClick={() => {
                setEditingTagId(null);
                setIsAddingTag(true);
            }}
            title={t("debt_tag_create")}
        >
            <MdAdd />
        </IconButton>
    );

    return (
        <>
            <BaseModal
                ref={ref}
                title={t("debt_tag_manage_title")}
                headerExtra={headerExtra}
            >
                <Box>
                    {isAddingTag && (
                        <Box mb={3} p={2} borderBottomWidth="1px" borderColor="border_primary">
                            <DebtTagEditor
                                existingTags={tags}
                                submitButtonText={t("debt_tag_create")}
                                submitButtonColorPalette="green"
                                onSubmit={handleCreateTag}
                                onCancel={() => setIsAddingTag(false)}
                                icon={<MdAdd />}
                            />
                        </Box>
                    )}

                    <Stack gap={2}>
                        {tags.map((tag) => {
                            const isEdit = editingTagId === tag.id;
                            return (
                                <Flex key={tag.id} justifyContent="space-between" alignItems="center" p={2} borderBottomWidth="1px" borderColor="border_primary">
                                    {isEdit ? (
                                        <DebtTagEditor
                                            initialName={tag.name}
                                            initialColor={tag.colorHex}
                                            existingTags={tags}
                                            currentTagId={tag.id}
                                            submitButtonText={t("modals_save_button")}
                                            submitButtonColorPalette="green"
                                            onSubmit={async (newName, newColor) => {
                                                await updateDebtTag({
                                                    ...tag,
                                                    name: newName,
                                                    colorHex: newColor
                                                });
                                                setEditingTagId(null);
                                                await onTagsChanged();
                                            }}
                                            onCancel={() => setEditingTagId(null)}
                                        />
                                    ) : (
                                        <DebtTagItem
                                            tag={tag}
                                            onEdit={() => {
                                                setIsAddingTag(false);
                                                setEditingTagId(tag.id);
                                            }}
                                            onDelete={() => handleDeleteRequested(tag)}
                                        />
                                    )}
                                </Flex>
                            );
                        })}
                        {tags.length === 0 && (
                            <Text color="gray.500" textAlign="center" py={4}>
                                {t("debt_tag_empty")}
                            </Text>
                        )}
                    </Stack>
                </Box>
            </BaseModal>

            <ConfirmModal
                ref={confirmModalRef}
                onConfirmed={onConfirmDelete}
                title={t("debt_tag_delete_confirm_title")}
                message={deleteMessage}
                confirmActionName={t("modals_delete_button")}
            />
        </>
    );
});

export default DebtTagManagerModal;
