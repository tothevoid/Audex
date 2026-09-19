import { Checkbox } from "@chakra-ui/react";
import React from "react";

export interface SwitchButtonProps {
    title: string;
    active: boolean;
    onSwitch: (active: boolean) => void;
    size?: "sm" | "md" | "lg";
}

const SwitchButton: React.FC<SwitchButtonProps> = ({ title, active, onSwitch, size = "sm" }) => {
    return (
        <Checkbox.Root
            checked={active}
            onCheckedChange={(details) => onSwitch(!!details.checked)}
            variant="solid"
            size={size}
            cursor="pointer"
        >
            <Checkbox.HiddenInput />
            <Checkbox.Control
                borderColor="border_primary"
                _checked={{
                    bg: "action_primary",
                    borderColor: "action_primary",
                    color: "white",
                }}
            />
            <Checkbox.Label color="text_primary" cursor="pointer" fontSize="sm">
                {title}
            </Checkbox.Label>
        </Checkbox.Root>
    );
};

export default SwitchButton;