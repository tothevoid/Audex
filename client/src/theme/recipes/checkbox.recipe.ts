import { defineSlotRecipe } from "@chakra-ui/react";

export const checkboxSlotRecipe = defineSlotRecipe({
    slots: ["root", "control", "label", "indicator"],
    base: {
        root: {
            cursor: "pointer",
        },
        control: {
            borderColor: "border_primary",
            bg: "transparent",
            _checked: {
                bg: "action_primary",
                borderColor: "action_primary",
                color: "white",
            },
        },
        label: {
            color: "text_primary",
            cursor: "pointer",
        },
    },
    variants: {
        variant: {
            solid: {
                control: {
                    borderColor: "border_primary",
                    bg: "transparent",
                    _checked: {
                        bg: "action_primary",
                        borderColor: "action_primary",
                        color: "white",
                    },
                },
            },
            subtle: {
                control: {
                    borderColor: "border_primary",
                    bg: "background_secondary",
                    _checked: {
                        bg: "status_success_bg",
                        borderColor: "status_success_border",
                        color: "status_success",
                    },
                },
            },
            outline: {
                control: {
                    borderColor: "border_primary",
                    bg: "transparent",
                    _checked: {
                        borderColor: "action_primary",
                        color: "action_primary",
                    },
                },
            },
        },
    },
});
