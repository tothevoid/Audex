import React from 'react';
import { BsBank, BsCurrencyExchange } from 'react-icons/bs';
import { StoredIcon, StoredIconProps, StoredIconSize, StoredIconShape } from '../StoredIcon';
import { ACCOUNT_TYPE } from '../../constants/accountType';
import { getBankIconUrl } from '../../../api/banks/bankApi';
import { Nullable } from '../../utilities/nullable';

export interface AccountIconTarget {
    accountType?: Nullable<{ id: string }>;
    bank?: Nullable<{ iconKey?: Nullable<string> }>;
}

export interface AccountIconProps extends Omit<StoredIconProps, 'src' | 'fallbackIcon'> {
    account?: Nullable<AccountIconTarget>;
    size?: StoredIconSize;
    shape?: StoredIconShape;
}

const fallbackIconSizes: Record<string, number> = {
    xs: 12,
    sm: 14,
    md: 20,
    lg: 22,
    xl: 28,
};

const getFallbackPixelSize = (size: StoredIconSize): number => {
    if (typeof size === 'number') {
        return Math.round(size * 0.6);
    }
    return fallbackIconSizes[size] ?? 20;
};

export const AccountIcon: React.FC<AccountIconProps> = ({
    account,
    size = 'md',
    shape = 'rounded',
    ...rest
}) => {
    const isCash = account?.accountType?.id === ACCOUNT_TYPE.CASH;
    const iconUrl = account?.bank?.iconKey ? getBankIconUrl(account.bank.iconKey) : undefined;
    const iconSize = getFallbackPixelSize(size);

    const fallbackIcon = isCash ? (
        <BsCurrencyExchange size={iconSize} color="var(--chakra-colors-text_secondary)" />
    ) : (
        <BsBank size={iconSize} color="var(--chakra-colors-text_secondary)" />
    );

    return (
        <StoredIcon
            src={iconUrl}
            fallbackIcon={fallbackIcon}
            size={size}
            shape={shape}
            {...rest}
        />
    );
};

export default AccountIcon;
