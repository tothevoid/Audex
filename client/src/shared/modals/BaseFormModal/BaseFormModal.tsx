import { FormEventHandler, forwardRef, ReactNode } from "react";
import { Button, Dialog, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";

export interface BaseFormModalProps {
    title: string;
    submitHandler: FormEventHandler;
    children: ReactNode;
    visibilityChanged?: (open: boolean) => void;
    saveButtonTitle?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full";
    maxW?: string;
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
                footer={({ closeModal }) => (
                    <Flex gap={3} justify="flex-end" w="100%">
                        <Button colorPalette="blue" type="submit">
                            {saveButtonTitle ?? t("modals_save_button")}
                        </Button>
                        <Dialog.ActionTrigger asChild>
                            <Button onClick={closeModal} variant="outline">
                                {t("modals_cancel_button")}
                            </Button>
                        </Dialog.ActionTrigger>
                    </Flex>
                )}
            >
                {children}
            </BaseModal>
        );
    }
);

BaseFormModal.displayName = "BaseFormModal";

export default BaseFormModal;
