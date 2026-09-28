import React, { forwardRef, useImperativeHandle } from "react";
import { Dialog, Portal, CloseButton, useDisclosure } from "@chakra-ui/react";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

export interface BaseModalProps {
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxW?: string;
    headerExtra?: React.ReactNode;
}

export const BaseModal = forwardRef<BaseModalRef, BaseModalProps>(
    ({ title, children, footer, maxW = "700px", headerExtra }, ref) => {
        const { open, onOpen, onClose } = useDisclosure();

        useImperativeHandle(ref, () => ({
            openModal: onOpen,
            closeModal: onClose,
        }));

        return (
            <Dialog.Root onEscapeKeyDown={onClose} onOpenChange={(e) => { if (!e.open) onClose(); }} placement="center" open={open}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                            maxW={maxW}
                        >
                            <Dialog.Header
                                fontSize="lg"
                                fontWeight="bold"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                pr={10}
                            >
                                <div>{title}</div>
                                {headerExtra}
                            </Dialog.Header>
                            <Dialog.Body maxH="70vh" overflowY="auto">
                                {children}
                            </Dialog.Body>
                            {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
                            <Dialog.CloseTrigger asChild>
                                <CloseButton onClick={onClose} size="sm" color="text_primary" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        );
    }
);

export default BaseModal;
