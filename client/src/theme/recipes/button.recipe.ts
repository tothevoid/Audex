import { defineRecipe } from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
    base: {
        color: "text_primary",
        fontWeight: "500",
        borderRadius: "md",
        _disabled: {
            opacity: 0.6,
            cursor: "not-allowed",
            color: "text_primary",
        },
    },
    variants: {
        variant: {
            solid: {
                bg: "action_primary",
                color: "white",
                _hover: {
                    bg: "action_primary",
                    opacity: 0.9,
                },
                _disabled: {
                    bg: "action_primary",
                    color: "white",
                    opacity: 0.7,
                },
            },
            outline: {
                bg: "transparent",
                color: "text_primary",
                borderColor: "border_primary",
                _hover: {
                    bg: "background_secondary",
                    borderColor: "border_primary",
                },
                _disabled: {
                    color: "text_secondary",
                    borderColor: "border_primary",
                    opacity: 0.5,
                },
            },
            subtle: {
                bg: "background_secondary",
                color: "text_primary",
                _hover: {
                    bg: "background_primary",
                },
            },
            ghost: {
                bg: "transparent",
                color: "text_primary",
                _hover: {
                    bg: "background_secondary",
                },
            },
        },
    },
});
