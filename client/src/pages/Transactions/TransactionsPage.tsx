import "./TransactionsPage.scss"

import React, { useEffect, useRef, useState } from 'react';
import Transaction from './components/Transaction/Transaction';
import { AccountEntity } from '../../models/accounts/AccountEntity';
import Pagination from './components/Pagination/Pagination';
import TransactionStats from './components/TransactionStats/TransactionStats';
import { Box, Checkbox, Flex, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { getAccountsByTypes } from '../../api/accounts/accountApi';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from "../../models/transactions/TransactionEntity";
import { formatDate } from "../../shared/utilities/formatters/dateFormatter";
import { formatMoneyByCurrencyCulture } from "../../shared/utilities/formatters/moneyFormatter";
import { useUserProfile } from "../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { useTransactions } from "./hooks/useTransactions";
import { groupByKey, sumEntities } from "../../shared/utilities/arrayUtilities";
import NewTransactionModal from "./modals/NewTransactionModal/NewTransactionModal";
import { CurrencyTransactionEntity } from "../../models/transactions/CurrencyTransactionEntity";
import { useEntityModal } from "../../shared/hooks/useEntityModal";
import { ActiveEntityMode } from "../../shared/enums/activeEntityMode";
import { ConfirmModal } from "../../shared/modals/ConfirmModal/ConfirmModal";
import TransactionModal from "./modals/TransactionModal/TransactionModal";
import AddButton from "../../shared/components/AddButton/AddButton";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";
import { ACCOUNT_TYPE } from "../../shared/constants/accountType";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import { createCurrencyTransaction } from "../../api/transactions/currencyTransactionApi";

interface State {
    accounts: AccountEntity[]
}

const TransactionsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useUserProfile();
    const [state, setState] = useState<State>({accounts: [] as AccountEntity[]});

    const { 
        activeEntity,
        modalRef,
        confirmModalRef,
        onEditClicked,
        onDeleteClicked,
        mode,
        onActionEnded
    } = useEntityModal<TransactionEntity>();

    const {
        transactions,
		createTransactionEntity,
		updateTransactionEntity,
		deleteTransactionEntity,
		setParams,
		params,
        isTransactionsLoading
    } = useTransactions({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), showSystem: false })

    useEffect(() => {
        const initData = async () => {
            await initAccounts();
        }
        initData();
    }, []);

    const initAccounts = async () => {
        const accounts = await getAccountsByTypes([
            ACCOUNT_TYPE.CASH,
            ACCOUNT_TYPE.DEBIT_CARD,
            ACCOUNT_TYPE.CREDIT_CARD
        ], true);
        setState((currentState) => {
            return {...currentState, accounts}
        })
    };

    const onPageSwitched = (month: number, year: number) => {
        setParams({month: month, year: year, showSystem: params.showSystem});
    }

    const onShowSystemSwitched = (showSystem: boolean) => {
		setParams({...params, showSystem: showSystem})
	}
  
    const groupedTransactions = groupByKey(transactions, (transaction) => transaction.date.getDate())

    const calculateSummary = (transactions: TransactionEntity[]) => {
        const sum = sumEntities(transactions, (transaction) => transaction.amount * transaction.account.currency.rate)
        return formatMoneyByCurrencyCulture(sum, user?.currency.name);
    }

    const addTransactionModalRef = useRef<BaseModalRef>(null);
            
    const onAddTransactionClick = () => {
        addTransactionModalRef.current?.openModal()
    }

    const onCreateCurrencyTransaction = async (currencyTransactionEntity: CurrencyTransactionEntity) => {
        await createCurrencyTransaction(currencyTransactionEntity);
    }

    const onTransactionSaved = async (transaction: TransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createTransactionEntity(transaction);
        } else {
            await updateTransactionEntity(transaction);
        }

        onActionEnded();
    }

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set")
        }

        await deleteTransactionEntity(activeEntity);
        onActionEnded();
    }

    return (
        <PageContainer color="text_primary">
            <SimpleGrid columns={2} gap={16}>
                <Box>
                    <Flex justifyContent={"space-between"}>
                        <Text fontSize="2xl" fontWeight={600}>{t("manager_transactions_title")}</Text>
                        <AddButton buttonTitle={t("manager_transactions_add_transaction")} onClick={onAddTransactionClick}/>
                    </Flex>
                    <Box marginBlock={"10px"}>
                        <Checkbox.Root checked={params.showSystem} onCheckedChange={(details) => onShowSystemSwitched(!!details.checked)} variant="solid">
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label color="text_primary">{t("manager_transactions_show_system")}</Checkbox.Label>
                        </Checkbox.Root>
                    </Box>
                    <Pagination year={params.year} month={params.month} onPageSwitched={onPageSwitched}/>
                    <Box>
                        { isTransactionsLoading && <VStack marginBlock={"50px"}> <Spinner size={"lg"}/> </VStack>}
                        {
                            !isTransactionsLoading && [...groupedTransactions.entries()].map(([transactionDay, transactions]) => 
                                <Box key={transactionDay}>
                                    <Flex justifyContent="space-between">
                                        <Text>{formatDate(new Date(params.year, params.month - 1, transactionDay), i18n, false)}</Text>
                                        <Text>{calculateSummary(transactions)}</Text>
                                    </Flex>
                                    
                                    {
                                        transactions.map((transaction: TransactionEntity) => {       
                                            return <Transaction key={transaction.id} 
                                                transaction={transaction}
                                                onUpdateClicked={onEditClicked}
                                                onDeleteClicked={onDeleteClicked} 
                                                accounts={state.accounts}>
                                            </Transaction>
                                        })
                                    }
                                </Box>
                            )
                        }
                        { !isTransactionsLoading && !transactions.length && <Box className="empty-transactions">{t("manager_transactions_no_transactions")}</Box>}
                    </Box>
                </Box>
                <Box>
                    {
                        transactions.length > 0 && <TransactionStats accounts={state.accounts} transactions={transactions}/>
                    }
                </Box>
            </SimpleGrid>
            <ConfirmModal onConfirmed={onDeleteConfirmed}
                title={t("transaction_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
			ref={confirmModalRef}/>
            <TransactionModal transaction={activeEntity} modalRef={modalRef} onSaved={onTransactionSaved}/>
            <NewTransactionModal modalRef={addTransactionModalRef} 
                onTransactionSaved={createTransactionEntity} onCurrencyTransactionSaved={onCreateCurrencyTransaction}/>
        </PageContainer>
    );
}

export default TransactionsPage;