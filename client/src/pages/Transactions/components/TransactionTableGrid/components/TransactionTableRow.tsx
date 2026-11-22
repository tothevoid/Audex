import React, { useMemo } from 'react';
import { Box, Button, Flex, HStack, Input, Table, Tooltip } from '@chakra-ui/react';
import { NumericFormat } from 'react-number-format';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { TransactionTypeEntity } from '@/models/transactions/TransactionTypeEntity';
import CardActionButtons from '@/shared/components/CardActionButtons/CardActionButtons';
import { computeRowDiff, EditableTransactionRow, EMPTY_ROW_DIFF } from '@/pages/Transactions/components/TransactionTableGrid/types';
import TableDateCell from '@/shared/components/TableDateCell/TableDateCell';
import BaseSelect from '@/shared/components/BaseSelect/BaseSelect';
import { getCurrencySymbol } from '@/shared/utilities/currencyUtils';
import { useAccounts } from '@/shared/hooks/queries/useAccounts';
import { useTransactionTypes } from '@/shared/hooks/queries/useTransactionTypes';

export interface TransactionTableRowProps {
    row: EditableTransactionRow;
    original?: EditableTransactionRow;
    isAdded: boolean;
    isDeleted: boolean;
    onRowChange: (id: string, updatedRow: EditableTransactionRow) => void;
    onRowRevert: (id: string) => void;
    onDuplicateRow: (row: EditableTransactionRow) => void;
    onDeleteRow: (id: string) => void;
}

export const TransactionTableRow: React.FC<TransactionTableRowProps> = React.memo(
    ({
        row,
        original,
        isAdded,
        isDeleted,
        onRowChange,
        onRowRevert,
        onDuplicateRow,
        onDeleteRow,
    }) => {
        const { t, i18n } = useTranslation();
        const { data: accounts = [] } = useAccounts();
        const { data: transactionTypes = [] } = useTransactionTypes();

        // Compute diff against original for current row
        const diff = useMemo(() => {
            if (isAdded || !original) return EMPTY_ROW_DIFF;
            return computeRowDiff(row, original, i18n);
        }, [row, original, isAdded, i18n]);

        const isIncome = row.amount > 0;
        const isRowModified = isAdded || diff.isModified;
        const currencySymbol = row.account ? getCurrencySymbol(row.account.currency.name, i18n.language) : '';
        const isNameInvalid = !isDeleted && !row.name.trim();
        const isAmountInvalid = !isDeleted && row.amount === 0;
        const isTypeInvalid = !isDeleted && !row.transactionType?.id;
        const isAccountInvalid = !isDeleted && !row.account?.id;

        const handleFieldChange = (updates: Partial<EditableTransactionRow>) => {
            const updatedRow: EditableTransactionRow = { ...row, ...updates };
            if (isAdded || !original) {
                onRowChange(row.id, updatedRow);
                return;
            }

            const nextDiff = computeRowDiff(updatedRow, original, i18n);
            if (nextDiff.isModified) {
                onRowChange(row.id, updatedRow);
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
                            <Box maxW="115px">
                                <TableDateCell
                                    disabled={isDeleted}
                                    value={row.date}
                                    onChange={(transactionDate) => handleFieldChange({ date: transactionDate })}
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
                    bg={isNameInvalid ? 'status_danger_bg' : diff.name.isModified ? 'status_warning_bg' : undefined}
                    borderColor={isNameInvalid ? 'status_danger_border' : diff.name.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!isNameInvalid && !diff.name.isModified}>
                        <Tooltip.Trigger asChild>
                            <Input
                                size="xs"
                                disabled={isDeleted}
                                value={row.name || ''}
                                onChange={(event) => handleFieldChange({ name: event.target.value })}
                                backgroundColor="transparent"
                                borderColor="transparent"
                                color="text_primary"
                                placeholder={t('quick_add_name_placeholder')}
                            />
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {isNameInvalid ? t('validation_field_required') : `${t('table_was')} ${diff.name.wasText}`}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Amount Cell */}
                <Table.Cell
                    bg={isAmountInvalid ? 'status_danger_bg' : diff.amount.isModified ? 'status_warning_bg' : undefined}
                    borderColor={isAmountInvalid ? 'status_danger_border' : diff.amount.isModified ? 'status_warning_border' : undefined}
                >
                    <Tooltip.Root disabled={!isAmountInvalid && !diff.amount.isModified}>
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
                                        const parsedValue = values.floatValue ?? 0;
                                        handleFieldChange({ amount: isIncome ? parsedValue : -parsedValue });
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
                                {currencySymbol && (
                                    <Box as="span" fontSize="2xs" color="text_secondary" userSelect="none" flexShrink={0}>
                                        {currencySymbol}
                                    </Box>
                                )}
                            </Flex>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {isAmountInvalid ? t('validation_amount_non_zero') : `${t('table_was')} ${diff.amount.wasText}`}
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
                            <Flex align="center" gap={1}>
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
                                {currencySymbol && (
                                    <Box as="span" fontSize="2xs" color="text_secondary" userSelect="none" flexShrink={0}>
                                        {currencySymbol}
                                    </Box>
                                )}
                            </Flex>
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
                    bg={isTypeInvalid ? 'status_danger_bg' : diff.transactionType.isModified ? 'status_warning_bg' : undefined}
                    borderColor={isTypeInvalid ? 'status_danger_border' : diff.transactionType.isModified ? 'status_warning_border' : undefined}
                    p={1}
                >
                    <Tooltip.Root disabled={!isTypeInvalid && !diff.transactionType.isModified}>
                        <Tooltip.Trigger asChild>
                            <Box minW="155px">
                                <BaseSelect<TransactionTypeEntity>
                                    size="sm"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                    collection={transactionTypes}
                                    selectedValue={row.transactionType}
                                    labelSelector={(transactionTypeItem) => transactionTypeItem.name}
                                    valueSelector={(transactionTypeItem) => transactionTypeItem.id}
                                    isOptionVisible={(transactionTypeItem) => transactionTypeItem.active}
                                    onSelected={(newType) => {
                                        if (newType) {
                                            handleFieldChange({ transactionType: newType });
                                        }
                                    }}
                                    isDisabled={isDeleted}
                                    isSearchable={true}
                                    isClearable={false}
                                    placeholder="—"
                                />
                            </Box>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {isTypeInvalid ? t('validation_transaction_type_required') : `${t('table_was')} ${diff.transactionType.wasText}`}
                            </Tooltip.Content>
                        </Tooltip.Positioner>
                    </Tooltip.Root>
                </Table.Cell>

                {/* Account Dropdown Cell */}
                <Table.Cell
                    bg={isAccountInvalid ? 'status_danger_bg' : diff.account.isModified ? 'status_warning_bg' : undefined}
                    borderColor={isAccountInvalid ? 'status_danger_border' : diff.account.isModified ? 'status_warning_border' : undefined}
                    p={1}
                >
                    <Tooltip.Root disabled={!isAccountInvalid && !diff.account.isModified}>
                        <Tooltip.Trigger asChild>
                            <Box minW="175px">
                                <BaseSelect<AccountEntity>
                                    size="sm"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                    collection={accounts}
                                    selectedValue={row.account}
                                    labelSelector={(accountItem) => `${accountItem.name} (${accountItem.currency.name})`}
                                    valueSelector={(accountItem) => accountItem.id}
                                    isOptionVisible={(accountItem) => accountItem.active}
                                    onSelected={(newAccount) => {
                                        if (newAccount) {
                                            handleFieldChange({ account: newAccount });
                                        }
                                    }}
                                    isDisabled={isDeleted}
                                    isSearchable={true}
                                    isClearable={false}
                                    placeholder="—"
                                />
                            </Box>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                            <Tooltip.Content bg="background_primary" color="text_primary" borderColor="border_primary" borderWidth="1px" fontSize="2xs">
                                {isAccountInvalid ? t('validation_account_required') : `${t('table_was')} ${diff.account.wasText}`}
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
        prev.isDeleted === next.isDeleted
);

TransactionTableRow.displayName = 'TransactionTableRow';
