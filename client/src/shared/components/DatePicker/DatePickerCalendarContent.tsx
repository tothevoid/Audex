import React from "react";
import {
    Button,
    DatePicker as ChakraDatePicker,
    Flex,
    Portal,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export interface DatePickerCalendarContentProps {
    isClearable: boolean;
    inline: boolean;
    disabled: boolean;
    hasSelectedDate: boolean;
}

export const DatePickerCalendarContent: React.FC<DatePickerCalendarContentProps> = ({
    isClearable,
    inline,
    disabled,
    hasSelectedDate,
}) => {
    const { t } = useTranslation();

    const content = (
        <ChakraDatePicker.Content
            backgroundColor="background_primary"
            borderColor="border_primary"
        >
            <ChakraDatePicker.View view="day">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.DayTable />
            </ChakraDatePicker.View>
            <ChakraDatePicker.View view="month">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.MonthTable />
            </ChakraDatePicker.View>
            <ChakraDatePicker.View view="year">
                <ChakraDatePicker.Header />
                <ChakraDatePicker.YearTable />
            </ChakraDatePicker.View>

            <ChakraDatePicker.Context>
                {(datePicker) => (
                    <Flex
                        justify={isClearable ? "space-between" : "flex-end"}
                        align="center"
                        pt={2}
                        mt={2}
                        borderTopWidth="1px"
                        borderColor="border_primary"
                    >
                        {isClearable && (
                            <Button
                                size="xs"
                                variant="ghost"
                                color="text_secondary"
                                _hover={{ color: "loss", bg: "background_secondary" }}
                                disabled={!hasSelectedDate || disabled}
                                onClick={() => {
                                    datePicker.clearValue();
                                    if (!inline) {
                                        datePicker.setOpen(false);
                                    }
                                }}
                            >
                                {t("date_picker_reset")}
                            </Button>
                        )}
                        <Button
                            size="xs"
                            variant="ghost"
                            color="action_primary"
                            _hover={{ bg: "background_secondary" }}
                            onClick={() => {
                                datePicker.selectToday();
                                if (!inline) {
                                    datePicker.setOpen(false);
                                }
                            }}
                        >
                            {t("date_picker_today")}
                        </Button>
                    </Flex>
                )}
            </ChakraDatePicker.Context>
        </ChakraDatePicker.Content>
    );

    if (inline) {
        return content;
    }

    return (
        <Portal>
            <ChakraDatePicker.Positioner zIndex="popover">
                {content}
            </ChakraDatePicker.Positioner>
        </Portal>
    );
};

export default DatePickerCalendarContent;
