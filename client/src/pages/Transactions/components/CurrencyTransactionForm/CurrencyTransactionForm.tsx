import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Field, Flex, Icon, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdSwapHoriz } from 'react-icons/md';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import CollectionSelect from '../../../../shared/components/CollectionSelect/CollectionSelect';
import DateSelect from '../../../../shared/components/DateSelect/DateSelect';
import MoneyInput from '../../../../shared/components/MoneyInput/MoneyInput';
import { CurrencyTransactionFormInput, getCurrencyTransactionValidationSchema } from './CurrencyTransactionValidationSchema';
import { getAccounts } from '../../../../api/accounts/accountApi';
import { CurrencyTransactionEntity } from '../../../../models/transactions/CurrencyTransactionEntity';
import { generateGuid } from '../../../../shared/utilities/idUtilities';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { SetSubmitHandler } from '../../modals/NewTransactionModal/NewTransactionModal';
import { ExchangeRateHint } from './components/ExchangeRateHint';
import { ExchangePreview } from './components/ExchangePreview';

interface Props {
    currencyTransaction?: CurrencyTransactionEntity | null;
    currentAccount?: AccountEntity | null;
    setSubmitHandler: SetSubmitHandler;
    onCurrencyTransactionSaved: (currencyTransaction: CurrencyTransactionEntity) => Promise<void>;
}

const CurrencyTransactionForm: React.FC<Props> = (props: Props) => {
    const { t } = useTranslation();

    const getDefaultTransactionFormState = useCallback(() => {
        const initialAmount = props.currencyTransaction?.amount ?? 0;
        const initialRate = props.currencyTransaction?.rate ?? 0;

        let defaultSource = props.currencyTransaction?.sourceAccount;
        let defaultDest = props.currencyTransaction?.destinationAccount;

        if (props.currentAccount && !props.currencyTransaction) {
            defaultDest = props.currentAccount;
        }

        return {
            id: props.currencyTransaction?.id ?? generateGuid(),
            name: props.currencyTransaction?.name ?? "",
            date: props.currencyTransaction?.date ?? new Date(),
            amount: initialAmount,
            rate: initialRate,
            sourceAccount: defaultSource,
            destinationAccount: defaultDest,
        };
    }, [props.currencyTransaction, props.currentAccount]);

    const validationSchema = useMemo(() => getCurrencyTransactionValidationSchema(t), [t]);

    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<CurrencyTransactionFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultTransactionFormState()
    });

    const [isCustomName, setIsCustomName] = useState<boolean>(!!props.currencyTransaction?.name);
    const [accounts, setAccounts] = useState<AccountEntity[]>([]);

    useEffect(() => {
        reset(getDefaultTransactionFormState());
        setIsCustomName(!!props.currencyTransaction?.name);
    }, [props.currencyTransaction, reset, getDefaultTransactionFormState]);

    useEffect(() => {
        getAccounts({ onlyActive: true }).then(setAccounts);
    }, []);

    const onCurrencyTransactionSaveClick = async (currencyTransaction: CurrencyTransactionFormInput) => {
        const formData: CurrencyTransactionEntity = {
            id: currencyTransaction.id!,
            name: currencyTransaction.name,
            amount: currencyTransaction.amount,
            rate: currencyTransaction.rate,
            date: currencyTransaction.date,
            sourceAccount: currencyTransaction.sourceAccount as AccountEntity,
            destinationAccount: currencyTransaction.destinationAccount as AccountEntity
        };
        await props.onCurrencyTransactionSaved(formData);
    };

    useEffect(() => {
        props.setSubmitHandler(handleSubmit, onCurrencyTransactionSaveClick);
    }, [accounts]);

    const selectedSourceAccount = watch("sourceAccount");
    const selectedDestAccount = watch("destinationAccount");

    const isCurrentAccountSource = Boolean(props.currentAccount && selectedSourceAccount?.id === props.currentAccount.id);
    const isCurrentAccountDest = Boolean(props.currentAccount && selectedDestAccount?.id === props.currentAccount.id);

    const findAccount = useCallback((account?: { id?: string } | null) => {
        if (!account?.id) return null;
        return accounts.find(a => a.id === account.id) ?? (props.currentAccount?.id === account.id ? props.currentAccount : null);
    }, [accounts, props.currentAccount]);

    const sourceAcc = useMemo(() => findAccount(selectedSourceAccount), [findAccount, selectedSourceAccount]);
    const destAcc = useMemo(() => findAccount(selectedDestAccount), [findAccount, selectedDestAccount]);

    const sourceCurrency = sourceAcc?.currency?.name ?? '';
    const destCurrency = destAcc?.currency?.name ?? '';

    // Auto-generate name when accounts change, unless user edited name manually
    useEffect(() => {
        if (isCustomName) return;

        const from = sourceCurrency || sourceAcc?.name;
        const to = destCurrency || destAcc?.name;

        if (from && to) {
            setValue("name", t("currency_transaction_auto_name", { from, to }), { shouldValidate: true });
        }
    }, [sourceCurrency, destCurrency, sourceAcc?.name, destAcc?.name, isCustomName, setValue, t]);

    // Market cross-rate calculation
    const marketRate = useMemo(() => {
        const sRate = sourceAcc?.currency?.rate;
        const dRate = destAcc?.currency?.rate;
        if (!sRate || !dRate || sRate <= 0 || dRate <= 0) return null;

        const crossRate = dRate / sRate;
        return Math.round(crossRate * 10000) / 10000;
    }, [sourceAcc, destAcc]);

    const amount = watch("amount") || 0;
    const rate = watch("rate") || 0;

    const applyMarketRate = () => {
        if (marketRate) {
            setValue("rate", marketRate, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleSwapAccounts = () => {
        const currentSource = watch("sourceAccount");
        const currentDest = watch("destinationAccount");

        setValue("sourceAccount", currentDest as AccountEntity, { shouldValidate: true });
        setValue("destinationAccount", currentSource as AccountEntity, { shouldValidate: true });
    };

    const availableLinkedAccounts = useMemo(() => {
        if (!props.currentAccount) return accounts;
        return accounts.filter(a =>
            a.id !== props.currentAccount!.id &&
            a.currency?.id !== props.currentAccount!.currency?.id
        );
    }, [accounts, props.currentAccount]);

    const getFilteredAccounts = useCallback((targetAccountObj?: { id?: string } | null) => {
        const found = findAccount(targetAccountObj);
        if (!found?.currency?.id) return accounts;
        return accounts.filter(a => a.currency?.id !== found.currency.id);
    }, [findAccount, accounts]);

    const availableSourceAccounts = useMemo(() => getFilteredAccounts(selectedDestAccount), [getFilteredAccounts, selectedDestAccount]);
    const availableDestAccounts = useMemo(() => getFilteredAccounts(selectedSourceAccount), [getFilteredAccounts, selectedSourceAccount]);

    const spentCalculated = useMemo(() => {
        return Math.round(amount * rate * 100) / 100;
    }, [amount, rate]);

    return (
        <Stack gap={4}>
            {/* Step 1: Exchange Route & Accounts Selection */}
            <Box
                p={4}
                borderRadius="xl"
                backgroundColor="background_primary"
                borderWidth="1px"
                borderColor="border_primary"
            >
                <Flex align="flex-start" justify="space-between" gap={3} direction={{ base: "column", md: "row" }}>
                    {/* Source Account */}
                    <Box flex={1} width="100%">
                        <Field.Root invalid={!!errors.sourceAccount}>
                            <Field.Label fontSize="sm" fontWeight="500" color="text_primary">
                                {t("entity_currency_transaction_source_account")}
                            </Field.Label>
                            <CollectionSelect
                                name="sourceAccount"
                                control={control}
                                placeholder={t("entity_currency_transaction_source_account_placeholder")}
                                collection={isCurrentAccountSource ? accounts : (props.currentAccount ? availableLinkedAccounts : availableSourceAccounts)}
                                labelSelector={(account => account.name)}
                                valueSelector={(account => account.id)}
                                isDisabled={isCurrentAccountSource}
                            />
                            <Field.ErrorText>{errors.sourceAccount?.message}</Field.ErrorText>
                        </Field.Root>
                    </Box>

                    {/* Swap Button */}
                    <Flex align="center" justify="center" pt={{ base: 0, md: "26px" }} alignSelf={{ base: "center", md: "flex-start" }}>
                        <Button
                            w="42px"
                            h="42px"
                            minW="42px"
                            minH="42px"
                            variant="subtle"
                            backgroundColor="background_secondary"
                            borderWidth="1px"
                            borderColor="border_primary"
                            borderRadius="full"
                            onClick={handleSwapAccounts}
                            title={t("currency_transaction_swap_accounts")}
                            _hover={{ backgroundColor: "background_primary", borderColor: "action_primary" }}
                        >
                            <Icon fontSize="22px" color="action_primary">
                                <MdSwapHoriz />
                            </Icon>
                        </Button>
                    </Flex>

                    {/* Destination Account */}
                    <Box flex={1} width="100%">
                        <Field.Root invalid={!!errors.destinationAccount}>
                            <Field.Label fontSize="sm" fontWeight="500" color="text_primary">
                                {t("entity_currency_transaction_destination_account")}
                            </Field.Label>
                            <CollectionSelect
                                name="destinationAccount"
                                control={control}
                                placeholder={t("entity_currency_transaction_destination_account_placeholder")}
                                collection={isCurrentAccountDest ? accounts : (props.currentAccount ? availableLinkedAccounts : availableDestAccounts)}
                                labelSelector={(account => account.name)}
                                valueSelector={(account => account.id)}
                                isDisabled={isCurrentAccountDest}
                            />
                            <Field.ErrorText>{errors.destinationAccount?.message}</Field.ErrorText>
                        </Field.Root>
                    </Box>
                </Flex>
            </Box>

            {/* Step 2: Amounts Flow (Give ➔ Get) */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {/* Amount to Give (Spent / Charged) */}
                <Field.Root invalid={!!errors.rate && spentCalculated <= 0}>
                    <Field.Label fontSize="sm" fontWeight="500" color="text_primary">
                        {t("currency_transaction_spent_amount")}
                    </Field.Label>
                    <Box
                        h="42px"
                        width="100%"
                        px={3}
                        borderRadius="md"
                        backgroundColor="background_primary"
                        borderWidth="1px"
                        borderColor="border_primary"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Text fontSize="sm" color="text_secondary">
                            {sourceCurrency || t("currency_transaction_total")}
                        </Text>
                        <Text fontSize="md" fontWeight={700} color="pnl_negative">
                            {sourceCurrency
                                ? `-${formatMoneyByCurrencyCulture(spentCalculated, sourceCurrency)}`
                                : spentCalculated}
                        </Text>
                    </Box>
                </Field.Root>

                {/* Amount to Get (Bought / Destination Amount) */}
                <Field.Root invalid={!!errors.amount}>
                    <Field.Label fontSize="sm" fontWeight="500" color="text_primary">
                        {t("currency_transaction_received_amount")}
                    </Field.Label>
                    <MoneyInput
                        name="amount"
                        control={control}
                        currency={destCurrency}
                        placeholder='1 000'
                    />
                    <Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
                </Field.Root>
            </SimpleGrid>

            {/* Step 3: Rate Control Card */}
            <Box
                p={3.5}
                borderRadius="xl"
                backgroundColor="background_primary"
                borderWidth="1px"
                borderColor="border_primary"
            >
                <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={2}>
                    <Text fontSize="sm" fontWeight="500" color="text_primary">
                        {t("currency_transaction_rate_title")} {destCurrency ? `(1 ${destCurrency} = ... ${sourceCurrency})` : ''}
                    </Text>
                    <ExchangeRateHint
                        marketRate={marketRate}
                        currency={sourceCurrency}
                        onApply={applyMarketRate}
                    />
                </Flex>

                <Field.Root invalid={!!errors.rate}>
                    <MoneyInput
                        name="rate"
                        control={control}
                        currency={sourceCurrency}
                        decimalScale={4}
                        placeholder='1.0000'
                        showWordsHelper={false}
                    />
                    <Field.ErrorText>{errors.rate?.message}</Field.ErrorText>
                </Field.Root>
            </Box>

            {/* Deal Preview Banner */}
            <ExchangePreview
                spentAmount={spentCalculated}
                sourceCurrency={sourceCurrency}
                receivedAmount={amount}
                destCurrency={destCurrency}
                rate={rate}
            />

            {/* Step 4: Date & Name (Compact bottom row) */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field.Root invalid={!!errors.date}>
                    <Field.Label fontSize="sm" fontWeight="500" color="text_primary">{t("entity_currency_transaction_date")}</Field.Label>
                    <DateSelect name="date" control={control} />
                    <Field.ErrorText>{errors.date?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.name}>
                    <Field.Label fontSize="sm" fontWeight="500" color="text_primary">{t("entity_currency_transaction_name")}</Field.Label>
                    <Input
                        {...register("name", {
                            onChange: () => setIsCustomName(true)
                        })}
                        placeholder={t("entity_currency_transaction_name_placeholder")}
                    />
                    <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                </Field.Root>
            </SimpleGrid>
        </Stack>
    );
};

export default CurrencyTransactionForm;