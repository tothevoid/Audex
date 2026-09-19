import React, { useMemo } from 'react';
import { Box, Button, Flex, HStack, Input, NativeSelect, Table, Tooltip } from '@chakra-ui/react';
import { NumericFormat } from 'react-number-format';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '../../../../../models/transactions/TransactionEntity';
import { AccountEntity } from '../../../../../models/accounts/AccountEntity';
import { TransactionTypeEntity } from '../../../../../models/transactions/TransactionTypeEntity';
import CardActionButtons from '../../../../../shared/components/CardActionButtons/CardActionButtons';
import DateInput from '../../../../../shared/components/DateInput/DateInput';
import { computeRowDiff, EMPTY_ROW_DIFF, RowDiff } from '../types';

export interface TransactionTableRowProps {
    row: TransactionEntity;
    original?: TransactionEntity;
    isAdded: boolean;
    isDeleted: boolean;
    accounts: AccountEntity[];
    transactionTypes: TransactionTypeEntity[];
    onRowChange: (id: string, updatedRow: TransactionEntity, diff: RowDiff) => void;
    onRowRevert: (id: string) => void;
    onDuplicateRow: (row: TransactionEntity) => void;
    onDeleteRow: (id: string) => void;
}

export const TransactionTableRow: React.FC<TransactionTableRowProps> = React.memo(
    ({
        row,
        original,
        isAdded,
        isDeleted,
        accounts,
        transactionTypes,
        onRowChange,
        onRowRevert,
        onDuplicateRow,
        onDeleteRow,
    }) => {
        const { t, i18n } = useTranslation();

        // Compute diff against original for current row
        const diff = useMemo(() => {
            if (isAdded || !original) return EMPTY_ROW_DIFF;
            return computeRowDiff(row, original, i18n);
        }, [row, original, isAdded, i18n]);

        const isIncome = row.amount > 0;
        const isRowModified = isAdded || diff.isModified;

        const handleFieldChange = (updates: Partial<TransactionEntity>) => {
            const updatedRow: TransactionEntity = { ...row, ...updates };
            if (isAdded || !original) {
                onRowChange(row.id, updatedRow, EMPTY_ROW_DIFF);
                return;
            }

            const nextDiff = computeRowDiff(updatedRow, original, i18n);
            if (nextDiff.isModified) {
                onRowChange(row.id, updatedRow, nextDiff);
            } else {
                onRowRevert(row.id);
            }
        };

        return (
            <Table.Row
                opacity={isDeleted ? 0.4 : 1}
                bg={isDeleted ? 'status_danger_bg' : isAdded ? 'status_success_bg' : undefined}
                textDecoration={isDeleted ? 'line-through' : 'none'}
            >
                {/* Date Cell */}
                <Table.Cell
                    bg={diff.date.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.date.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.date.isModified}>
                        <Tooltip.Trigger asChild>
                            <Box maxW="105px">
                                <DatePicker
                                    disabled={isDeleted}
                                    autoComplete="off"
                                    selected={row.date ? new Date(row.date) : new Date()}
                                    onChange={(d) => d && handleFieldChange({ date: d })}
                                    dateFormat="dd.MM.yyyy"
                                    customInput={<DateInput size="xs" backgroundColor="transparent" borderColor="transparent" />}
                                />
                            </Box>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.date.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Name Cell */}
                <Table.Cell
                    bg={diff.name.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.name.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.name.isModified}>
                        <Tooltip.Trigger asChild>
                            <Input
                                size="xs"
                                disabled={isDeleted}
                                value={row.name || ''}
                                onChange={(e) => handleFieldChange({ name: e.target.value })}
                                backgroundColor="transparent"
                                borderColor="transparent"
                                color="text_primary"
                                placeholder={t('quick_add_name_placeholder')}
                            />
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.name.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Amount Cell */}
                <Table.Cell
                    bg={diff.amount.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.amount.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.amount.isModified}>
                        <Tooltip.Trigger asChild>
                            <Flex align="center" gap={1}>
                                <Button
                                    size="2xs"
                                    variant="ghost"
                                    px={1.5}
                                    color={isIncome ? 'gain' : 'loss'}
                                    fontWeight={700}
                                    fontSize="sm"
                                    onClick={() => handleFieldChange({ amount: -row.amount })}
                                    title="Toggle Income/Expense"
                                >
                                    {isIncome ? '+' : '–'}
                                </Button>
                                <NumericFormat
                                    customInput={Input}
                                    size="xs"
                                    disabled={isDeleted}
                                    value={Math.abs(row.amount)}
                                    onValueChange={(values) => {
                                        const val = values.floatValue ?? 0;
                                        handleFieldChange({ amount: isIncome ? val : -val });
                                    }}
                                    thousandSeparator=" "
                                    decimalSeparator=","
                                    decimalScale={2}
                                    allowNegative={false}
                                    placeholder="0"
                                    autoComplete="off"
                                    color={isIncome ? 'gain' : 'loss'}
                                    fontWeight={700}
                                    backgroundColor="transparent"
                                    borderColor="transparent"
                                />
                            </Flex>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.amount.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Cashback Cell */}
                <Table.Cell
                    bg={diff.cashback.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.cashback.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.cashback.isModified}>
                        <Tooltip.Trigger asChild>
                            <NumericFormat
                                customInput={Input}
                                size="xs"
                                disabled={isDeleted || isIncome}
                                value={row.cashback || ''}
                                onValueChange={(values) => {
                                    handleFieldChange({ cashback: values.floatValue ?? 0 });
                                }}
                                thousandSeparator=" "
                                decimalSeparator=","
                                decimalScale={2}
                                allowNegative={false}
                                placeholder="0"
                                autoComplete="off"
                                color="text_primary"
                                backgroundColor="transparent"
                                borderColor="transparent"
                            />
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.cashback.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Category Dropdown Cell */}
                <Table.Cell
                    bg={diff.transactionType.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.transactionType.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.transactionType.isModified}>
                        <Tooltip.Trigger asChild>
                            <NativeSelect.Root size="xs" disabled={isDeleted}>
                                <NativeSelect.Field
                                    value={row.transactionType?.id || ''}
                                    onChange={(e) => {
                                        const newType = transactionTypes.find((t) => t.id === e.target.value);
                                        if (newType) handleFieldChange({ transactionType: newType });
                                    }}
                                    backgroundColor="transparent"
                                    borderColor="transparent"
                                    color="text_primary"
                                >
                                    {transactionTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.transactionType.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Account Dropdown Cell */}
                <Table.Cell
                    bg={diff.account.isModified ? 'status_warning_bg' : undefined}
                    borderColor={diff.account.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!diff.account.isModified}>
                        <Tooltip.Trigger asChild>
                            <NativeSelect.Root size="xs" disabled={isDeleted}>
                                <NativeSelect.Field
                                    value={row.account?.id || ''}
                                    onChange={(e) => {
                                        const newAcc = accounts.find((a) => a.id === e.target.value);
                                        if (newAcc) handleFieldChange({ account: newAcc });
                                    }}
                                    backgroundColor="transparent"
                                    borderColor="transparent"
                                    color="text_primary"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.currency?.name})
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {t('table_was')} {diff.account.wasText}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Action Buttons */}
                <Table.Cell textAlign="right">
                    <HStack gap={1} justify="flex-end">
                        {!isDeleted ? (
                            <CardActionButtons
                                size="xs"
                                onUndo={() => onRowRevert(row.id)}
                                undoTitle={t('table_reset_row_tooltip')}
                                undoVisible={isRowModified}
                                onCopy={() => onDuplicateRow(row)}
                                copyTitle={t('table_duplicate_row')}
                                onDelete={() => onDeleteRow(row.id)}
                                deleteTitle={t('table_delete_row')}
                            />
                        ) : (
                            <CardActionButtons
                                size="xs"
                                onUndo={() => onRowRevert(row.id)}
                                undoTitle={t('table_restore_row')}
                                undoColor="action_primary"
                            />
                        )}
                    </HStack>
                </Table.Cell>
            </Table.Row>
        );
    },
    (prev, next) =>
        prev.row === next.row &&
        prev.original === next.original &&
        prev.isAdded === next.isAdded &&
        prev.isDeleted === next.isDeleted &&
        prev.accounts === next.accounts &&
        prev.transactionTypes === next.transactionTypes
);

TransactionTableRow.displayName = 'TransactionTableRow';
