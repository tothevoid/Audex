import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TransactionEntity } from "@/models/transactions/TransactionEntity";
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from "@/api/transactions/transactionApi";
import { GetTransactionsQuery } from "@/models/transactions/GetTransactionsQuery";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export interface TransactionsQuery {
	month?: number | null;
	year: number;
	showSystem: boolean;
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
				const query: GetTransactionsQuery = {
					month: queryParameters.month,
					year: queryParameters.year,
					showSystem: queryParameters.showSystem,
				};
				const fetchedTransactions = await getTransactions(query);
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

		if (isCurrentPeriodTransaction(createdTransaction)) {
			const newTransactions = [createdTransaction, ...transactions].sort(
				(firstTransaction, secondTransaction) =>
					new Date(secondTransaction.date).getTime() - new Date(firstTransaction.date).getTime()
			);
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

		if (!isCurrentPeriodTransaction(updatedTransaction)) {
			deleteTransactionFromCollection(updatedTransaction);
		} else {
			const existingTransaction = transactions.find(
				(transaction: TransactionEntity) => transaction.id === updatedTransaction.id
			);

			const isDateChanged = existingTransaction
				? new Date(existingTransaction.date).toDateString() !== new Date(updatedTransaction.date).toDateString()
				: false;

			const newTransactions = transactions.map((transaction: TransactionEntity) => {
				return transaction.id === updatedTransaction.id ?
					{ ...updatedTransaction } :
					transaction;
			});

			if (!isDateChanged) {
				setTransactions(newTransactions);
			} else {
				const sortedTransactions = [...newTransactions].sort(
					(firstTransaction, secondTransaction) =>
						new Date(secondTransaction.date).getTime() - new Date(firstTransaction.date).getTime()
				);
				setTransactions(sortedTransactions);
			}
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

	const isCurrentPeriodTransaction = (transaction: TransactionEntity): boolean => {
		const transactionDate = new Date(transaction.date);
		if (transactionDate.getFullYear() !== queryParameters.year) {
			return false;
		}

		if (queryParameters.month !== undefined && queryParameters.month !== null) {
			return transactionDate.getMonth() === queryParameters.month - 1;
		}

		return true;
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