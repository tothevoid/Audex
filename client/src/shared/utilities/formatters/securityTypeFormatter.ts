import i18n, { TFunction } from 'i18next';
import { SecurityTypeEntity } from '../../../models/securities/SecurityTypeEntity';

export const SECURITY_TYPE_IDS = {
    Stock: '23b0a73a-9ac1-4fb5-a763-3c10424ed798',
    Bond: '16184209-1716-4854-a293-75776e1b4ec0',
    InvestmentFundUnit: '209dcb50-989f-44f7-b886-0d7f5c763593',
    Currency: '2ccd0a40-4339-4be7-9f4d-fbf5c31b20c2',
    PreciousMetal: '2deb13a0-c49a-4589-83e5-52df6ac46174'
};

const SECURITY_TYPE_KEY_MAP: Record<string, string> = {
    [SECURITY_TYPE_IDS.PreciousMetal.toLowerCase()]: 'security_type_precious_metal',
    [SECURITY_TYPE_IDS.InvestmentFundUnit.toLowerCase()]: 'security_type_investment_fund_unit',
    [SECURITY_TYPE_IDS.Stock.toLowerCase()]: 'security_type_stock',
    [SECURITY_TYPE_IDS.Bond.toLowerCase()]: 'security_type_bond',
    [SECURITY_TYPE_IDS.Currency.toLowerCase()]: 'security_type_currency',
};

export const getSecurityTypeLabel = (type?: SecurityTypeEntity | string | null, t?: TFunction): string => {
    if (!type) {
        throw new Error("SecurityType is required for label formatting.");
    }
    const typeId = typeof type === 'object' ? type.id : type;
    if (!typeId) {
        throw new Error("SecurityType ID is missing.");
    }

    const idLower = typeId.toLowerCase();
    const translationKey = SECURITY_TYPE_KEY_MAP[idLower];

    if (!translationKey) {
        throw new Error(`Unknown SecurityType ID '${typeId}'. No translation key configured.`);
    }

    const translate = t || i18n.t.bind(i18n);
    const label = translate(translationKey);

    if (!label || label === translationKey) {
        throw new Error(`Translation for key '${translationKey}' not found.`);
    }

    return label;
};
