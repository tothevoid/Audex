import { Checkbox, ConditionalValue } from "@chakra-ui/react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface Props<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    title: string;
    control: Control<TFieldValues>;
    variant?: ConditionalValue<"outline" | "solid" | "subtle" | undefined>;
}

const CheckboxInput = <TFieldValues extends FieldValues>({
    name,
    title,
    control,
    variant = "solid",
}: Props<TFieldValues>) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => (
                <Checkbox.Root
                    checked={value}
                    onCheckedChange={(data) => {
                        onChange(data.checked);
                    }}
                    variant={variant}
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
                    <Checkbox.Label color="text_primary" cursor="pointer">
                        {title}
                    </Checkbox.Label>
                </Checkbox.Root>
            )}
        />
    );
};

export default CheckboxInput;