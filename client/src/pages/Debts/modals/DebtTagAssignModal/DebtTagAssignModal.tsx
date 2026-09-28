import { forwardRef, useEffect, useState } from "react";
import { Button, Stack, Text, Box } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtEntity } from "@/models/debts/DebtEntity";
import { DebtTagEntity } from "@/models/debts/DebtTagEntity";
import DebtTagSelect from "@/pages/Debts/components/DebtTagSelect/DebtTagSelect";
import DebtTagEditor from "@/pages/Debts/components/DebtTagEditor/DebtTagEditor";
import { createDebtTag } from "@/api/debts/debtTagApi";
import { MdAdd } from "react-icons/md";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";

interface Props {
    debt: DebtEntity | null;
    availableTags: DebtTagEntity[];
    onSaved: (debt: DebtEntity, newTags: DebtTagEntity[]) => Promise<void>;
    onTagsReloadRequested: () => Promise<void>;
}

export const DebtTagAssignModal = forwardRef<BaseModalRef, Props>(
    ({ debt, availableTags, onSaved, onTagsReloadRequested }, ref) => {
        const { t } = useTranslation();
        const [selectedTags, setSelectedTags] = useState<DebtTagEntity[]>([]);

        useEffect(() => {
            if (debt) {
                setSelectedTags(debt.debtTags || []);
            }
        }, [debt]);

        const handleSave = async (closeModal?: () => void) => {
            if (!debt) return;
            await onSaved(debt, selectedTags);
            if (closeModal) {
                closeModal();
            }
        };

        const handleCreateTag = async (name: string, colorHex: string) => {
            const createdTag = await createDebtTag({ name, colorHex });
            await onTagsReloadRequested();
            if (createdTag) {
                setSelectedTags((prev) => [...prev, createdTag]);
            }
        };

        return (
            <BaseModal
                ref={ref}
                title={t("debt_tag_assign_modal_title", { name: debt?.name || "" })}
                footer={
                    <>
                        <Button
                            colorPalette="green"
                            onClick={() => handleSave(() => (ref as any)?.current?.closeModal())}
                        >
                            {t("modals_save_button")}
                        </Button>
                    </>
                }
            >
                <Stack gap={4}>
                    <Text fontSize="sm" color="gray.400">
                        {t("debt_tag_assign_modal_subtitle")}
                    </Text>
                    <Box>
                        <DebtTagSelect
                            availableTags={availableTags}
                            selectedTags={selectedTags}
                            onChange={setSelectedTags}
                        />
                    </Box>
                    <Box borderTopWidth="1px" borderColor="border_primary" pt={3}>
                        <DebtTagEditor
                            existingTags={availableTags}
                            submitButtonText={t("debt_tag_create")}
                            submitButtonColorPalette="green"
                            onSubmit={handleCreateTag}
                            icon={<MdAdd />}
                        />
                    </Box>
                </Stack>
            </BaseModal>
        );
    }
);

export default DebtTagAssignModal;
