import { ElementType, FormEventHandler, forwardRef, ReactNode, useImperativeHandle } from "react";
import { CloseButton, Dialog, DialogRootProps, Portal, useDisclosure } from "@chakra-ui/react";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

export interface ModalFooterHelpers {
    closeModal: () => void;
}

export interface BaseModalProps {
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode | ((helpers: ModalFooterHelpers) => ReactNode);
    headerExtra?: ReactNode;
    maxW?: string;
    size?: DialogRootProps["size"];
    minH?: string;
    role?: "dialog" | "alertdialog";
    as?: ElementType;
    onSubmit?: FormEventHandler;
    visibilityChanged?: (open: boolean) => void;
    bodyMaxH?: string;
    hasBody?: boolean;
}

export const BaseModal = forwardRef<BaseModalRef, BaseModalProps>(
    (
        {
            title,
            children,
            footer,
            headerExtra,
            maxW = "700px",
            size,
            minH,
            role,
            as,
            onSubmit,
            visibilityChanged,
            bodyMaxH = "calc(75dvh - 100px)",
            hasBody = true,
        },
        ref
    ) => {
        const { open, onOpen, onClose } = useDisclosure();

        const handleOpen = () => {
            onOpen();
            visibilityChanged?.(true);
        };

        const handleClose = () => {
            onClose();
            visibilityChanged?.(false);
        };

        useImperativeHandle(ref, () => ({
            openModal: handleOpen,
            closeModal: handleClose,
        }));

        return (
            <Dialog.Root
                size={size}
                placement="center"
                open={open}
                role={role}
                onEscapeKeyDown={handleClose}
                onOpenChange={(event) => {
                    if (event.open) {
                        handleOpen();
                    } else {
                        handleClose();
                    }
                }}
            >
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner
                        p={{ base: "12px", sm: "16px", md: "24px" }}
                        overflowY="auto"
                    >
                        <Dialog.Content
                            as={as}
                            onSubmit={onSubmit}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            borderWidth="1px"
                            color="text_primary"
                            width="100%"
                            maxW={maxW}
                            minH={minH}
                            maxH={{
                                base: "calc(100dvh - 24px)",
                                sm: "calc(100dvh - 32px)",
                                md: "calc(100dvh - 48px)"
                            }}
                            my="auto"
                            mx="auto"
                        >
                            <Dialog.Header
                                fontSize="lg"
                                fontWeight="bold"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                pr={10}
                                color="text_primary"
                            >
                                <Dialog.Title as="div" color="text_primary">
                                    {title}
                                </Dialog.Title>
                                {headerExtra}
                            </Dialog.Header>

                            {hasBody ? (
                                <Dialog.Body maxH={bodyMaxH} overflowY="auto" color="text_primary">
                                    {children}
                                </Dialog.Body>
                            ) : (
                                children
                            )}

                            {footer && (
                                <Dialog.Footer color="text_primary">
                                    {typeof footer === "function"
                                        ? footer({ closeModal: handleClose })
                                        : footer}
                                </Dialog.Footer>
                            )}

                            <Dialog.CloseTrigger asChild>
                                <CloseButton onClick={handleClose} size="sm" color="text_primary" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        );
    }
);

BaseModal.displayName = "BaseModal";

export default BaseModal;
