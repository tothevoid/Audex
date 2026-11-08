import { forwardRef, ReactNode } from "react";
import { Button, ButtonProps, Icon } from "@chakra-ui/react";

export interface HeaderButtonProps extends Omit<ButtonProps, "children"> {
    icon: ReactNode;
    "aria-label": string;
}

export const HeaderButton = forwardRef<HTMLButtonElement, HeaderButtonProps>(
    ({ icon, ...restButtonProps }, ref) => (
        <Button
            ref={ref}
            h="38px"
            w="38px"
            minW="38px"
            p={0}
            borderWidth="1px"
            borderColor="border_primary"
            background="button_background_secondary"
            color="text_primary"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
                borderColor: "action_primary",
                backgroundColor: "background_primary"
            }}
            {...restButtonProps}
        >
            <Icon color="card_action_icon_primary" fontSize="1.15rem">
                {icon}
            </Icon>
        </Button>
    )
);

HeaderButton.displayName = "HeaderButton";

export default HeaderButton;

