import { FormEventHandler, forwardRef, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import {
    ModalCancelButton,
    ModalConfirmButton,
    ModalFooterActions,
} from "@/shared/modals/components/ModalButtons";

export interface BaseFormModalProps {
    title: string;
    submitHandler: FormEventHandler;
    children: ReactNode;
    visibilityChanged?: (open: boolean) => void;
    saveButtonTitle?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full";
    maxW?: string;
    bodyOverflowY?: "auto" | "visible" | "hidden";
}

export const BaseFormModal = forwardRef<BaseModalRef, BaseFormModalProps>(
    (
        {
            title,
            submitHandler,
            children,
            visibilityChanged,
            saveButtonTitle,
            size,
            maxW,
            bodyOverflowY,
        },
        ref
    ) => {
        const { t } = useTranslation();

        return (
            <BaseModal
                ref={ref}
                title={title}
                as="form"
                onSubmit={submitHandler}
                visibilityChanged={visibilityChanged}
                size={size}
                maxW={maxW}
                bodyOverflowY={bodyOverflowY}
                footer={({ closeModal }) => (
                    <ModalFooterActions>
                        <ModalConfirmButton type="submit">
                            {saveButtonTitle ?? t("modals_save_button")}
                        </ModalConfirmButton>
                        <ModalCancelButton asActionTrigger onClick={closeModal} />
                    </ModalFooterActions>
                )}
            >
                {children}
            </BaseModal>
        );
    }
);

BaseFormModal.displayName = "BaseFormModal";

export default BaseFormModal;
