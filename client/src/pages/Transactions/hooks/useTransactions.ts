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

export const useTransactions = (initialQueryParameters: TransactionsQuery) => {
	const { t } = useTranslation();
	const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
	const [isTransactionsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [queryParameters, setQueryParameters] = useState<TransactionsQuery>(initialQueryParameters);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadTransactions = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const fetchedTransactions = await getTransactions(
					queryParameters.month,
					queryParameters.year,
					queryParameters.showSystem
				);
				if (isMounted) {
					setTransactions(fetchedTransactions);
					setError(null);
				}
			} catch (error: unknown) {
				if (isMounted) {
					setError(parseErrorMessage(error, t("error_data_load")));
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, [queryParameters, refreshTrigger, t]);

	const createTransactionEntity = async (transaction: TransactionEntity) => {
		const createdTransaction = await createTransaction(transaction);
		if (!createdTransaction) {
			return;
		}

		if (isCurrentMonthTransaction(createdTransaction)) {
			const newTransactions = insertByPredicate([...transactions], createdTransaction, 
				(transactionElement: TransactionEntity) => (transactionElement.date <= createdTransaction.date));
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
		return transaction.date.getMonth() === queryParameters.month - 1 &&
			   transaction.date.getFullYear() === queryParameters.year;
	};

	return {
		transactions,
		isTransactionsLoading,
		error,
		createTransactionEntity,
		updateTransactionEntity,
		deleteTransactionEntity,
		reloadTransactions,
		refetch: reloadTransactions,
		queryParameters,
		setQueryParameters,
		params: queryParameters,
		setParams: setQueryParameters
	};
};