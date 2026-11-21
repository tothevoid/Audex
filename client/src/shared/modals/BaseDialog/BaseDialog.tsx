import { FC, ReactNode } from "react";
import { Dialog, Portal } from "@chakra-ui/react";

export interface BaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    maxW?: string;
    role?: "dialog" | "alertdialog";
    initialFocusEl?: () => HTMLElement | null;
}

export const BaseDialog: FC<BaseDialogProps> = ({
    open,
    onOpenChange,
    title,
    children,
    footer,
    maxW = "480px",
    role = "dialog",
    initialFocusEl,
}) => {
    return (
        <Dialog.Root
            placement="center"
            open={open}
            role={role}
            initialFocusEl={initialFocusEl}
            onOpenChange={(event) => onOpenChange(event.open)}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner
                    p={{ base: "12px", sm: "16px", md: "24px" }}
                    overflowY="auto"
                >
                    <Dialog.Content
                        backgroundColor="background_primary"
                        borderColor="border_primary"
                        borderWidth="1px"
                        color="text_primary"
                        width="100%"
                        maxW={maxW}
                        my="auto"
                        mx="auto"
                        borderRadius="md"
                        boxShadow="lg"
                    >
                        <Dialog.Header
                            fontSize="lg"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            gap={2}
                            borderBottomWidth="1px"
                            borderColor="border_primary"
                            px={{ base: 4, md: 6 }}
                            py={4}
                            color="text_primary"
                        >
                            <Dialog.Title as="div" color="text_primary">
                                {title}
                            </Dialog.Title>
                        </Dialog.Header>

                        {children && (
                            <Dialog.Body px={{ base: 4, md: 6 }} py={4} color="text_primary">
                                {children}
                            </Dialog.Body>
                        )}

                        {footer && (
                            <Dialog.Footer
                                borderTopWidth="1px"
                                borderColor="border_primary"
                                px={{ base: 4, md: 6 }}
                                py={4}
                                color="text_primary"
                            >
                                {footer}
                            </Dialog.Footer>
                        )}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default BaseDialog;
