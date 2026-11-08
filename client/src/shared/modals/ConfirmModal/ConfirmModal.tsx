import { forwardRef } from "react";
import { Box, Button, Dialog, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";

export interface ConfirmModalProps {
    onConfirmed: () => Promise<void> | void;
    title: string;
    message?: string;
    confirmActionName?: string;
    description?: string;
}

export const ConfirmModal = forwardRef<BaseModalRef, ConfirmModalProps>(
    ({ onConfirmed, title, message, confirmActionName }, ref) => {
        const { t } = useTranslation();

        return (
            <BaseModal
                ref={ref}
                title={title}
                maxW="480px"
                role="alertdialog"
                footer={({ closeModal }) => (
                    <Flex gap={3} justify="flex-end" w="100%">
                        <Button
                            background="red.600"
                            onClick={() => {
                                closeModal();
                                onConfirmed();
                            }}
                        >
                            {confirmActionName}
                        </Button>
                        <Dialog.ActionTrigger asChild>
                            <Button onClick={closeModal} variant="outline">
                                {t("modals_cancel_button")}
                            </Button>
                        </Dialog.ActionTrigger>
                    </Flex>
                )}
            >
                <Box color="text_primary">
                    {message}
                </Box>
            </BaseModal>
        );
    }
);

ConfirmModal.displayName = "ConfirmModal";

export default ConfirmModal;
