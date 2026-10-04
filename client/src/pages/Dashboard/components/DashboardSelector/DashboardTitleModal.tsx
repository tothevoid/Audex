import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Field, Input } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";

export interface DashboardTitleModalRef {
    openWithTitle: (initialTitle?: string) => void;
    closeModal: () => void;
}

interface DashboardTitleModalProps {
    title: string;
    onSave: (title: string) => void;
}

export const DashboardTitleModal = forwardRef<DashboardTitleModalRef, DashboardTitleModalProps>(({
    title: modalTitle,
    onSave
}, ref) => {
    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);
    const [inputValue, setInputValue] = useState("");

    useImperativeHandle(ref, () => ({
        openWithTitle: (initialTitle = "") => {
            setInputValue(initialTitle);
            modalRef.current?.openModal();
        },
        closeModal: () => {
            modalRef.current?.closeModal();
        }
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        onSave(trimmed);
        modalRef.current?.closeModal();
    };

    return (
        <BaseFormModal
            ref={modalRef}
            title={modalTitle}
            saveButtonTitle={t("modals_save_button")}
            submitHandler={handleSubmit}
            size="sm"
        >
            <Field.Root>
                <Field.Label>{t("dashboard_create_title")}</Field.Label>
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("dashboard_create_placeholder")}
                    backgroundColor="background_secondary"
                    borderColor="border_primary"
                    color="text_primary"
                    autoFocus
                />
            </Field.Root>
        </BaseFormModal>
    );
});

DashboardTitleModal.displayName = "DashboardTitleModal";
