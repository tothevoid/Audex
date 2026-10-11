import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TransactionEntity } from "@/models/transactions/TransactionEntity";
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from "@/api/transactions/transactionApi";
import { insertByPredicate, reorderByPredicate } from "@/shared/utilities/arrayUtilities";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export interface TransactionsQuery {
	month: number,
	year: number,
	showSystem: boolean
}

export const useTransactions = (initialParams: TransactionsQuery) => {
	const { t } = useTranslation();
	const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
	const [isTransactionsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [params, setParams] = useState<TransactionsQuery>(initialParams);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const transactions = await getTransactions(params.month, params.year, params.showSystem);
			setTransactions(transactions);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [params, t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createTransactionEntity = async (transaction: TransactionEntity) => {
		const createdTransaction = await createTransaction(transaction);
		if (!createdTransaction) {
			return;
		}

		if (isCurrentMonthTransaction(createdTransaction)) {
			const newTransactions = insertByPredicate([...transactions], createdTransaction, 
				(transactionElm: TransactionEntity) => (transactionElm.date <= createdTransaction.date));
			setTransactions(newTransactions);
		}

		notify.success(
			t("transactions_toast_created_title"),
			t("transactions_toast_created_desc", { name: createdTransaction.name || `${createdTransaction.amount}` })
		);
	};

	const updateTransactionEntity = async (updatedTransaction: TransactionEntity) => {
		const updated = await updateTransaction(updatedTransaction);
		if (!updated) {
			return;
		}

		if (!isCurrentMonthTransaction(updatedTransaction)) {
			deleteTransactionFromCollection(updatedTransaction);
		} else {
			const newTransactions = transactions.map((transaction: TransactionEntity) => {
				return transaction.id === updatedTransaction.id ?
					{...updatedTransaction}:
					transaction;
			});

			// TODO: date is not changed => reorder is not required 
			const updatedTransactions = reorderByPredicate(newTransactions, updatedTransaction, 
				(currentElement: TransactionEntity) => (currentElement.date <= updatedTransaction.date),
				(currentElement: TransactionEntity) => (currentElement.id !== updatedTransaction.id));

			setTransactions(updatedTransactions);
		}

		notify.success(
			t("transactions_toast_updated_title"),
			t("transactions_toast_updated_desc", { name: updatedTransaction.name || `${updatedTransaction.amount}` })
		);
	};

	const deleteTransactionEntity = async (deletedTransaction: TransactionEntity) => {
		if (!deletedTransaction) {
			return;
		}
		
		await deleteTransaction(deletedTransaction.id);

		deleteTransactionFromCollection(deletedTransaction);
		notify.success(
			t("transactions_toast_deleted_title"),
			t("transactions_toast_deleted_desc", { name: deletedTransaction.name || `${deletedTransaction.amount}` })
		);
	};
	
	const deleteTransactionFromCollection = (deletingTransaction: TransactionEntity) => {
		const updatedTransactions = transactions
			.filter((transaction: TransactionEntity) => transaction.id !== deletingTransaction.id);
		setTransactions(updatedTransactions);
	};

	const isCurrentMonthTransaction = (transaction: TransactionEntity): boolean => {
		return transaction.date.getMonth() === params.month - 1 &&
			   transaction.date.getFullYear() === params.year;
	};

	return {
		transactions,
		isTransactionsLoading,
		error,
		createTransactionEntity,
		updateTransactionEntity,
		deleteTransactionEntity,
		refetch: fetchData,
		setParams,
		params
	};
};