import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { TransactionTypeEntity } from '@/models/transactions/TransactionTypeEntity';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import { i18n as I18nType } from 'i18next';
import { EditableGridDiff } from '@/shared/hooks/useEditableGrid';
import { ViewDisplayMode } from '@/pages/Transactions/components/TransactionFilterBar/TransactionFilterBar';

export interface FieldDiff {
    isModified: boolean;
    wasText: string;
}

export interface RowDiff {
    isModified: boolean;
    date: FieldDiff;
    name: FieldDiff;
    amount: FieldDiff;
    cashback: FieldDiff;
    transactionType: FieldDiff;
    account: FieldDiff;
}

export interface EditableTransactionRow {
    id: string;
    name: string;
    amount: number;
    cashback: number;
    date: Date;
    account?: AccountEntity;
    transactionType?: TransactionTypeEntity;
    isSystem: boolean;
}

export const isTransactionRowValid = (row: EditableTransactionRow): boolean => {
    const hasValidName = row.name.trim().length > 0;
    const hasValidAmount = row.amount !== 0;
    const hasValidAccount = Boolean(row.account?.id);
    const hasValidTransactionType = Boolean(row.transactionType?.id);

    return hasValidName && hasValidAmount && hasValidAccount && hasValidTransactionType;
};

export const EMPTY_FIELD_DIFF: FieldDiff = { isModified: false, wasText: '' };

export const EMPTY_ROW_DIFF: RowDiff = {
    isModified: false,
    date: EMPTY_FIELD_DIFF,
    name: EMPTY_FIELD_DIFF,
    amount: EMPTY_FIELD_DIFF,
    cashback: EMPTY_FIELD_DIFF,
    transactionType: EMPTY_FIELD_DIFF,
    account: EMPTY_FIELD_DIFF,
};

export const computeRowDiff = (
    current: EditableTransactionRow,
    original: EditableTransactionRow | undefined,
    i18n: I18nType
): RowDiff => {
    if (!original) return EMPTY_ROW_DIFF;

    const dateModified = new Date(original.date).toDateString() !== new Date(current.date).toDateString();
    const nameModified = (original.name || '') !== (current.name || '');
    const amountModified = original.amount !== current.amount;
    const cashbackModified = (original.cashback || 0) !== (current.cashback || 0);
    const typeModified = original.transactionType?.id !== current.transactionType?.id;
    const accountModified = original.account?.id !== current.account?.id;

    const isModified = dateModified || nameModified || amountModified || cashbackModified || typeModified || accountModified;

    return {
        isModified,
        date: { isModified: dateModified, wasText: dateModified ? formatDate(original.date, i18n, false) : '' },
        name: { isModified: nameModified, wasText: nameModified ? (original.name || '—') : '' },
        amount: { isModified: amountModified, wasText: amountModified && original.account ? formatMoneyByCurrencyCulture(original.amount, original.account.currency.name) : '' },
        cashback: { isModified: cashbackModified, wasText: cashbackModified && original.account ? formatMoneyByCurrencyCulture(original.cashback, original.account.currency.name) : '' },
        transactionType: { isModified: typeModified, wasText: typeModified ? (original.transactionType?.name || '—') : '' },
        account: { isModified: accountModified, wasText: accountModified ? (original.account?.name || '—') : '' },
    };
};

export interface OutOfPeriodItem {
    name: string;
    dateStr: string;
}

export interface TransactionTableGridProps {
    transactions: TransactionEntity[];
    accounts: AccountEntity[];
    transactionTypes: TransactionTypeEntity[];
    selectedAccountId?: string;
    selectedCategoryId?: string;
    onCommitDiff: (diff: EditableGridDiff<TransactionEntity>) => Promise<void>;
    onRefresh: () => void;
    isRefreshing?: boolean;
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
    isAnalyticsOpen?: boolean;
    onToggleAnalytics?: () => void;
}

export const getOutOfPeriodItems = (
    diff: EditableGridDiff<TransactionEntity>,
    month: number | null | undefined,
    year: number,
    i18n: I18nType
): OutOfPeriodItem[] => {
    const outOfPeriodItems: OutOfPeriodItem[] = [];

    [...diff.added, ...diff.updated].forEach((transactionItem) => {
        const itemDate = new Date(transactionItem.date);
        const isOutOfPeriod = month !== undefined && month !== null
            ? itemDate.getMonth() + 1 !== month || itemDate.getFullYear() !== year
            : itemDate.getFullYear() !== year;

        if (isOutOfPeriod) {
            const displayName = transactionItem.name || transactionItem.transactionType?.name || transactionItem.account?.name || '—';
            outOfPeriodItems.push({
                name: displayName,
                dateStr: formatDate(itemDate, i18n, false),
            });
        }
    });

    return outOfPeriodItems;
};
