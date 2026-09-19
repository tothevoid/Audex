import { Button, ButtonProps, IconButton } from "@chakra-ui/react";
import React from "react";
import { MdAdd } from "react-icons/md";

export interface AddButtonProps extends Omit<ButtonProps, "onClick"> {
    buttonTitle?: string;
    onClick: () => void;
    size?: ButtonProps["size"];
    isCompact?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
    buttonTitle,
    onClick,
    size = "md",
    isCompact = false,
    ...rest
}) => {
    const iconSize = size === "xs" || size === "2xs" ? 16 : 18;

    if (isCompact) {
        return (
            <IconButton
                size={size}
                variant="solid"
                aria-label={buttonTitle || "Add"}
                title={buttonTitle}
                onClick={onClick}
                {...rest}
            >
                <MdAdd size={iconSize} />
            </IconButton>
        );
    }

    return (
        <Button
            size={size}
            variant="solid"
            onClick={onClick}
            {...rest}
        >
            <MdAdd size={iconSize} />
            {buttonTitle}
        </Button>
    );
};

export default AddButton;