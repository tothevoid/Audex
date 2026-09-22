import { defineSlotRecipe } from "@chakra-ui/react";

export const tabsSlotRecipe = defineSlotRecipe({
    slots: ["root", "list", "trigger", "content", "indicator", "contentGroup"],
    base: {
        list: {
            bg: "background_primary",
            borderColor: "border_primary",
        },
        trigger: {
            color: "text_secondary",
            bg: "transparent",
            _hover: {
                bg: "background_secondary",
                color: "text_primary",
            },
            _selected: {
                bg: "action_primary",
                color: "white",
                shadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                _hover: {
                    bg: "action_primary",
                    color: "white",
                },
            },
        },
    },
    variants: {
        variant: {
            enclosed: {
                list: {
                    bg: "background_primary",
                    borderColor: "border_primary",
                    padding: "4px",
                    borderRadius: "lg",
                    gap: "3px",
                },
                trigger: {
                    borderRadius: "md",
                    bg: "transparent",
                    color: "text_secondary",
                    fontWeight: "500",
                    _hover: {
                        bg: "background_secondary",
                        color: "text_primary",
                    },
                    _selected: {
                        bg: "action_primary",
                        color: "white",
                        shadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                        _hover: {
                            bg: "action_primary",
                            color: "white",
                        },
                    },
                },
            },
            line: {
                list: {
                    borderColor: "border_primary",
                },
                trigger: {
                    color: "text_secondary",
                    _selected: {
                        color: "action_primary",
                        borderColor: "action_primary",
                    },
                },
            },
        },
    },
});
