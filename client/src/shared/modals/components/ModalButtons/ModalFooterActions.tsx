import { FC, ReactNode } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

export interface ModalFooterActionsProps extends FlexProps {
    children: ReactNode;
}

export const ModalFooterActions: FC<ModalFooterActionsProps> = ({
    children,
    gap = 3,
    justify = "flex-end",
    w = "100%",
    ...restProps
}) => {
    return (
        <Flex gap={gap} justify={justify} w={w} {...restProps}>
            {children}
        </Flex>
    );
};

export default ModalFooterActions;
