import { defineSlotRecipe } from "@chakra-ui/react";

export const datePickerSlotRecipe = defineSlotRecipe({
    slots: [
        "clearTrigger",
        "content",
        "control",
        "input",
        "label",
        "monthSelect",
        "nextTrigger",
        "positioner",
        "presetTrigger",
        "prevTrigger",
        "rangeText",
        "root",
        "table",
        "tableBody",
        "tableCell",
        "tableCellTrigger",
        "tableHead",
        "tableHeader",
        "tableRow",
        "trigger",
        "view",
        "viewControl",
        "viewTrigger",
        "yearSelect",
        "indicatorGroup",
    ],
    base: {
        content: {
            bg: "background_primary",
            borderColor: "border_primary",
            borderWidth: "1px",
            borderRadius: "md",
            boxShadow: "lg",
            color: "text_primary",
            p: "3",
        },
        input: {
            bg: "background_primary",
            borderColor: "border_primary",
            borderWidth: "1px",
            borderRadius: "md",
            color: "text_primary",
            _hover: {
                borderColor: "border_primary",
            },
            _focusVisible: {
                borderColor: "action_primary",
                boxShadow: "0 0 0 1px {colors.action_primary}",
            },
        },
        trigger: {
            color: "text_secondary",
            _hover: {
                color: "text_primary",
            },
        },
        clearTrigger: {
            color: "text_secondary",
            _hover: {
                color: "loss",
            },
        },
        viewTrigger: {
            color: "text_primary",
            borderRadius: "md",
            _hover: {
                bg: "background_secondary",
            },
        },
        prevTrigger: {
            color: "text_primary",
            borderRadius: "md",
            _hover: {
                bg: "background_secondary",
            },
        },
        nextTrigger: {
            color: "text_primary",
            borderRadius: "md",
            _hover: {
                bg: "background_secondary",
            },
        },
        tableHeader: {
            color: "text_secondary",
            fontSize: "xs",
        },
        tableCellTrigger: {
            color: "text_primary",
            borderRadius: "md",
            _hover: {
                bg: "background_secondary",
            },
            _today: {
                color: "action_primary",
                fontWeight: "bold",
            },
            "&[data-selected]": {
                bg: "action_primary",
                color: "white",
                _hover: {
                    bg: "action_primary",
                },
            },
            "&[data-in-range]": {
                bg: "background_secondary",
                color: "text_primary",
            },
            "&[data-disabled]": {
                opacity: 0.35,
                cursor: "not-allowed",
            },
        },
    },
});
