import i18n, { TFunction } from 'i18next';
import { AccountTypeEntity } from '../../../models/accounts/AccountTypeEntity';

export const ACCOUNT_TYPE_IDS = {
    Cash: 'a08f5553-379e-4294-a2e5-75e88219433c',
    DebitCard: 'cda2ce07-551e-48cf-988d-270c0d022866',
    CreditCard: '6ea1867f-c067-412c-b443-8b9bc2467202'
};

const ACCOUNT_TYPE_KEY_MAP: Record<string, string> = {
    [ACCOUNT_TYPE_IDS.Cash.toLowerCase()]: 'account_type_cash',
    [ACCOUNT_TYPE_IDS.DebitCard.toLowerCase()]: 'account_type_debit_card',
    [ACCOUNT_TYPE_IDS.CreditCard.toLowerCase()]: 'account_type_credit_card',
};

export const getAccountTypeLabel = (type?: AccountTypeEntity | string | null, t?: TFunction): string => {
    if (!type) {
        throw new Error("AccountType is required for label formatting.");
    }
    const typeId = typeof type === 'object' ? type.id : type;
    if (!typeId) {
        throw new Error("AccountType ID is missing.");
    }

    const idLower = typeId.toLowerCase();
    const translationKey = ACCOUNT_TYPE_KEY_MAP[idLower];

    if (!translationKey) {
        throw new Error(`Unknown AccountType ID '${typeId}'. No translation key configured.`);
    }

    const translate = t || i18n.t.bind(i18n);
    const label = translate(translationKey);

    if (!label || label === translationKey) {
        throw new Error(`Translation for key '${translationKey}' not found.`);
    }

    return label;
};
