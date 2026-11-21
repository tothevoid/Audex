import { forwardRef } from "react";
import { Button, ButtonProps, Dialog } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export interface ModalCancelButtonProps extends ButtonProps {
    asActionTrigger?: boolean;
}

export const ModalCancelButton = forwardRef<HTMLButtonElement, ModalCancelButtonProps>(
    ({ children, asActionTrigger = false, variant = "outline", ...restProps }, ref) => {
        const { t } = useTranslation();
        const content = children ?? t("modals_cancel_button");

        const buttonElement = (
            <Button ref={ref} variant={variant} {...restProps}>
                {content}
            </Button>
        );

        if (asActionTrigger) {
            return <Dialog.ActionTrigger asChild>{buttonElement}</Dialog.ActionTrigger>;
        }

        return buttonElement;
    }
);

ModalCancelButton.displayName = "ModalCancelButton";

export default ModalCancelButton;
