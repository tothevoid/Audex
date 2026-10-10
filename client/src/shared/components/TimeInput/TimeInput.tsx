import React from 'react';
import { Input, InputProps } from '@chakra-ui/react';

export interface TimeInputProps extends Omit<InputProps, 'onChange' | 'value'> {
    value: string;
    onChange: (value: string) => void;
    maxW?: string | number;
}

export const TimeInput: React.FC<TimeInputProps> = ({
    value,
    onChange,
    maxW = '200px',
    ...rest
}) => {
    return (
        <Input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            backgroundColor="background_primary"
            color="text_primary"
            borderColor="border_primary"
            maxW={maxW}
            css={{
                '&::-webkit-calendar-picker-indicator': {
                    cursor: 'pointer'
                }
            }}
            {...rest}
        />
    );
};

export default TimeInput;
