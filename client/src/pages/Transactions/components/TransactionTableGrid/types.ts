import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { TransactionTypeEntity } from '../../../../models/transactions/TransactionTypeEntity';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { i18n as I18nType } from 'i18next';

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
    current: TransactionEntity,
    orig: TransactionEntity | undefined,
    i18n: I18nType
): RowDiff => {
    if (!orig) return EMPTY_ROW_DIFF;

    const dateModified = new Date(orig.date).toDateString() !== new Date(current.date).toDateString();
    const nameModified = (orig.name || '') !== (current.name || '');
    const amountModified = orig.amount !== current.amount;
    const cashbackModified = (orig.cashback || 0) !== (current.cashback || 0);
    const typeModified = orig.transactionType?.id !== current.transactionType?.id;
    const accountModified = orig.account?.id !== current.account?.id;

    const isModified = dateModified || nameModified || amountModified || cashbackModified || typeModified || accountModified;

    return {
        isModified,
        date: { isModified: dateModified, wasText: dateModified ? formatDate(orig.date, i18n, false) : '' },
        name: { isModified: nameModified, wasText: nameModified ? (orig.name || '—') : '' },
        amount: { isModified: amountModified, wasText: amountModified ? formatMoneyByCurrencyCulture(orig.amount, orig.account?.currency?.name) : '' },
        cashback: { isModified: cashbackModified, wasText: cashbackModified ? String(orig.cashback || 0) : '' },
        transactionType: { isModified: typeModified, wasText: typeModified ? (orig.transactionType?.name || '—') : '' },
        account: { isModified: accountModified, wasText: accountModified ? (orig.account?.name || '—') : '' },
    };
};

export interface CommitDiffPayload {
    added: TransactionEntity[];
    updated: TransactionEntity[];
    deletedIds: string[];
}

export interface OutOfMonthItem {
    name: string;
    dateStr: string;
}

export interface TransactionTableGridProps {
    transactions: TransactionEntity[];
    accounts: AccountEntity[];
    transactionTypes: TransactionTypeEntity[];
    selectedMonth?: number;
    selectedYear?: number;
    selectedAccountId?: string;
    onCommitDiff: (diff: CommitDiffPayload) => Promise<void>;
    onRefresh: () => void;
}
