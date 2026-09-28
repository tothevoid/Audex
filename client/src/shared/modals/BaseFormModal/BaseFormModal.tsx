import { Button, CloseButton, Dialog, Portal, useDisclosure} from "@chakra-ui/react";
import { FormEventHandler, forwardRef, useEffect, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

interface BaseFormModalProps {
    title: string,
    submitHandler: FormEventHandler,
    children: React.ReactNode,
    visibilityChanged?: (open: boolean) => void
    saveButtonTitle?: string
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full"
    maxW?: string
};

const BaseFormModal = forwardRef<BaseModalRef, BaseFormModalProps>(({
    title,
    submitHandler,
    children,
    visibilityChanged,
    saveButtonTitle,
    size,
    maxW,
}: BaseFormModalProps, ref) => {
    const { open, onOpen, onClose } = useDisclosure();

    useImperativeHandle(ref, () => ({
        openModal: onOpen,
        closeModal: onClose
    }));

    useEffect(() => {
        if (!visibilityChanged) {
            return;
        }
        visibilityChanged(open);
    }, [open, visibilityChanged]);

    const { t } = useTranslation();

    return (
        <Dialog.Root size={size} placement="center" open={open} onEscapeKeyDown={onClose} onOpenChange={(e) => { if (!e.open) onClose(); }}>
          <Portal>
            <Dialog.Backdrop/>
            <Dialog.Positioner>
                <Dialog.Content
                    as="form"
                    onSubmit={submitHandler}
                    backgroundColor="background_primary"
                    borderColor="border_primary"
                    color="text_primary"
                    maxW={maxW}
                >
                    <Dialog.Header>
                        <Dialog.Title color="text_primary">{title}</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body pb={6}>
                        {children}
                    </Dialog.Body>
                    <Dialog.Footer gap={3}>
                        <Button type="submit" variant="solid">{saveButtonTitle ?? t("modals_save_button")}</Button>
                        <Button onClick={onClose} variant="outline">{t("modals_cancel_button")}</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton onClick={onClose} size="sm" color="text_primary" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
    );
});
export default BaseFormModal;