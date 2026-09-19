import React, { forwardRef } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

export interface DateInputProps extends Omit<InputProps, 'ref'> {
    value?: string;
    onClick?: React.MouseEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    (
        {
            value,
            onClick,
            onChange,
            placeholder = 'dd.mm.yyyy',
            size = 'sm',
            backgroundColor = 'background_primary',
            borderColor = 'border_primary',
            ...rest
        },
        ref
    ) => (
        <Input
            ref={ref}
            value={value ?? ''}
            onClick={onClick}
            onChange={onChange}
            placeholder={placeholder}
            size={size}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            color="text_primary"
            autoComplete="off"
            {...rest}
        />
    )
);

DateInput.displayName = 'DateInput';

export default DateInput;
