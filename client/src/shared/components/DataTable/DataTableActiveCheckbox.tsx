import React from "react";
import { Checkbox } from "@chakra-ui/react";

export interface DataTableActiveCheckboxProps {
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export const DataTableActiveCheckbox: React.FC<DataTableActiveCheckboxProps> = ({
    checked,
    disabled = false,
    onChange,
}) => {
    return (
        <Checkbox.Root
            checked={checked}
            disabled={disabled}
            cursor="pointer"
            variant="subtle"
            onCheckedChange={(eventDetails) => {
                onChange(Boolean(eventDetails.checked));
            }}
        >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
        </Checkbox.Root>
    );
};

export default DataTableActiveCheckbox;
