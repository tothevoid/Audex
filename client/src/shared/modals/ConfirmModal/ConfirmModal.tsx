import { Button, CloseButton, Dialog, Portal, useDisclosure } from "@chakra-ui/react";
import React, { forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

interface Props {
    onConfirmed: () => Promise<void>
    title: string,
    message: string,
    confirmActionName: string
}

export const ConfirmModal = forwardRef<BaseModalRef, Props>((props: Props, ref) => {
    const { open, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef<HTMLButtonElement>(null!);
    useImperativeHandle(ref, () => ({
        openModal: onOpen,
        closeModal: onClose
    }));

    const onConfirmed = () => {
        onClose();
        props.onConfirmed();
    };

    const { t } = useTranslation();

    return <Dialog.Root
        onEscapeKeyDown={onClose}
        onOpenChange={(e) => { if (!e.open) onClose(); }}
        placement="center"
        open={open}
        role="alertdialog">
        <Portal>
            <Dialog.Backdrop/>
            <Dialog.Positioner>
                <Dialog.Content
                    backgroundColor="background_primary"
                    borderColor="border_primary"
                    color="text_primary"
                >
                    <Dialog.Header fontSize='lg' fontWeight='bold' color="text_primary">
                        {props.title}
                    </Dialog.Header>
                    <Dialog.Body color="text_primary">
                        {props.message}
                    </Dialog.Body>
                    <Dialog.Footer gap={3}>
                        <Button background="red.600" onClick={onConfirmed}>
                            {props.confirmActionName}
                        </Button>
                        <Dialog.ActionTrigger asChild>
                            <Button ref={cancelRef} onClick={onClose} variant="outline">{t("modals_cancel_button")}</Button>
                        </Dialog.ActionTrigger>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton onClick={onClose} size="sm" color="text_primary" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog.Root>;
});