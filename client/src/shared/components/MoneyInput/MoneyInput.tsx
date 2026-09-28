import { Box, Input, InputProps, Text } from '@chakra-ui/react';
import { NumericFormat } from 'react-number-format';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { formatNumberToWords } from '@/shared/utilities/formatters/numberWordsFormatter';

export interface MoneyInputProps<T extends FieldValues>
    extends Omit<InputProps, 'name' | 'defaultValue' | 'value' | 'onChange' | 'onBlur' | 'type'> {
    name: Path<T>;
    control: Control<T>;
    currency: string;
    placeholder?: string;
    showWordsHelper?: boolean;
    decimalScale?: number;
    allowNegative?: boolean;
    disabled?: boolean;
}

export const MoneyInput = <T extends FieldValues>({
    name,
    control,
    currency,
    placeholder = '0',
    showWordsHelper = true,
    decimalScale = 2,
    allowNegative = false,
    disabled = false,
    ...rest
}: MoneyInputProps<T>) => {
    const { t } = useTranslation();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, onBlur, value, ref } }) => {
                const numericValue = typeof value === 'number' ? value : parseFloat(String(value ?? '')) || 0;
                const inputValue: string | number =
                    typeof value === 'number' || typeof value === 'string' ? value : '';

                return (
                    <Box width="100%">
                        <Box position="relative" width="100%">
                            <NumericFormat
                                customInput={Input}
                                getInputRef={ref}
                                value={inputValue}
                                onValueChange={(values) => {
                                    onChange(values.floatValue ?? 0);
                                }}
                                onBlur={onBlur}
                                thousandSeparator=" "
                                decimalSeparator=","
                                decimalScale={decimalScale}
                                allowNegative={allowNegative}
                                placeholder={placeholder}
                                autoComplete="off"
                                disabled={disabled}
                                color="text_primary"
                                backgroundColor="background_primary"
                                borderColor="border_primary"
                                pr={currency ? '60px' : '12px'}
                                {...rest}
                            />
                            {currency && (
                                <Text
                                    position="absolute"
                                    right="12px"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    color="gray.400"
                                    fontSize="sm"
                                    fontWeight="medium"
                                    pointerEvents="none"
                                    userSelect="none"
                                >
                                    {currency}
                                </Text>
                            )}
                        </Box>
                        {showWordsHelper && numericValue >= 1000 && (
                            <Text fontSize="xs" color="gray.400" mt={1}>
                                💡 {formatNumberToWords(numericValue, t)} {currency}
                            </Text>
                        )}
                    </Box>
                );
            }}
        />
    );
};

export default MoneyInput;
