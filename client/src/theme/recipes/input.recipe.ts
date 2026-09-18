import { defineRecipe } from "@chakra-ui/react";

export const inputRecipe = defineRecipe({
    variants: {
        variant: {
            outline: {
                borderColor: "border_primary",
                backgroundColor: "background_primary",
                color: "text_primary",
                _hover: {
                    borderColor: "border_primary",
                },
                _focusVisible: {
                    borderColor: "action_primary",
                    boxShadow: "0 0 0 1px {colors.action_primary}",
                },
            },
        },
    },
});
