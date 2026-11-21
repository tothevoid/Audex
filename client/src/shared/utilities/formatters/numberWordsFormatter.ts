import i18n, { TFunction } from 'i18next';

export const formatNumberToWords = (num: number, t: TFunction): string => {
    if (!num || isNaN(num)) return '';
    const locale = i18n.language || 'en';

    if (num >= 1_000_000_000) {
        const value = (num / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 });
        return `${value} ${t('number_unit_billion')}`.trim();
    }
    if (num >= 1_000_000) {
        const value = (num / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 });
        return `${value} ${t('number_unit_million')}`.trim();
    }
    if (num >= 1_000) {
        const value = (num / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 });
        return `${value} ${t('number_unit_thousand')}`.trim();
    }
    return num.toString();
};
