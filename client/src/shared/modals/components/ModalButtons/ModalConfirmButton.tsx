import { forwardRef } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export interface ModalConfirmButtonProps extends ButtonProps {
    isDestructive?: boolean;
}

export const ModalConfirmButton = forwardRef<HTMLButtonElement, ModalConfirmButtonProps>(
    ({ children, isDestructive = false, ...restProps }, ref) => {
        const { t } = useTranslation();

        const defaultContent = isDestructive
            ? t("modals_delete_button")
            : t("modals_confirm_button");

        if (isDestructive) {
            return (
                <Button
                    ref={ref}
                    background="red.600"
                    color="white"
                    _hover={{ background: "red.700" }}
                    {...restProps}
                >
                    {children ?? defaultContent}
                </Button>
            );
        }

        return (
            <Button
                ref={ref}
                colorPalette="blue"
                {...restProps}
            >
                {children ?? defaultContent}
            </Button>
        );
    }
);

ModalConfirmButton.displayName = "ModalConfirmButton";

export default ModalConfirmButton;
