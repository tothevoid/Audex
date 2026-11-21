import { FC, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { ConfirmDialogOptions } from "@/shared/context/ConfirmDialogContext/ConfirmDialogContext";
import BaseDialog from "@/shared/modals/BaseDialog/BaseDialog";
import {
    ModalCancelButton,
    ModalConfirmButton,
    ModalFooterActions,
} from "@/shared/modals/components/ModalButtons";

interface ConfirmDialogProps {
    isOpen: boolean;
    options: ConfirmDialogOptions | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
    isOpen,
    options,
    onConfirm,
    onCancel,
}) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    if (!options) {
        return null;
    }

    const {
        title,
        message,
        confirmActionName,
        cancelActionName,
        isDestructive = false,
        maxW = "480px",
    } = options;

    return (
        <BaseDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onCancel();
                }
            }}
            title={title}
            maxW={maxW}
            role="alertdialog"
            initialFocusEl={() => cancelButtonRef.current}
            footer={
                <ModalFooterActions>
                    <ModalConfirmButton
                        isDestructive={isDestructive}
                        onClick={onConfirm}
                    >
                        {confirmActionName}
                    </ModalConfirmButton>
                    <ModalCancelButton
                        ref={cancelButtonRef}
                        asActionTrigger
                        onClick={onCancel}
                    >
                        {cancelActionName}
                    </ModalCancelButton>
                </ModalFooterActions>
            }
        >
            {message && <Box color="text_primary">{message}</Box>}
        </BaseDialog>
    );
};

export default ConfirmDialog;
