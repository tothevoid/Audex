import { useCallback, useEffect, useState } from "react";
import { createSecurityTransaction, deleteSecurityTransaction, getSecurityTransactions, updateSecurityTransaction } from "../../../api/securities/securityTransactionApi";
import { SecurityTransactionEntity, SecurityTransactionEntityRequest } from "../../../models/securities/SecurityTransactionEntity";
import { Nullable } from "../../../shared/utilities/nullable";
import {
	createDefaultSecurityTransactionsRequest,
	SecurityTransactionsRequest
} from "../../../models/securities/SecurityTransactionsRequest";

export const useSecurityTransactions = (brokerAccountId: Nullable<string>) => {
	const [securityTransactions, setSecurityTransactions] = useState<SecurityTransactionEntity[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [isSecurityTransactionsLoading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [securityTransactionsQueryParameters, setSecurityTransactionsQueryParameters] = useState<SecurityTransactionsRequest>(() =>
		createDefaultSecurityTransactionsRequest(brokerAccountId)
	);

	useEffect(() => {
		setSecurityTransactionsQueryParameters(previousQueryParameters => ({
			...previousQueryParameters,
			brokerAccountId,
			pageIndex: 1
		}));
	}, [brokerAccountId]);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const pagedResult = await getSecurityTransactions(securityTransactionsQueryParameters);
			setSecurityTransactions(pagedResult.items);
			setTotalCount(pagedResult.totalCount);
		} catch (exception: any) {
			setError(exception?.message || 'Ошибка загрузки данных');
		} finally {
			setLoading(false);
		}
	}, [securityTransactionsQueryParameters]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createSecurityTransactionEntity = async (createdSecurityTransaction: SecurityTransactionEntityRequest) => {
		const securityTransaction = await createSecurityTransaction(createdSecurityTransaction);
		if (!securityTransaction) {
			return;
		}

		await fetchData();
	};

	const updatedSecurityTransactionEntity = async (updatedSecurityTransaction: SecurityTransactionEntityRequest) => {
		const securityTransactionUpdated = await updateSecurityTransaction(updatedSecurityTransaction);
		if (!securityTransactionUpdated) {
			return;
		}

		await fetchData();
	};

	const deleteSecurityTransactionEntity = async (deletedSecurityTransaction: SecurityTransactionEntity) => {
		const securityTransactionDeleted = await deleteSecurityTransaction(deletedSecurityTransaction.id);
		if (!securityTransactionDeleted) {
			return;
		}

		await fetchData();
	};

	return {
		securityTransactions,
		totalCount,
		isSecurityTransactionsLoading,
		error,
		createSecurityTransactionEntity,
		updatedSecurityTransactionEntity,
		deleteSecurityTransactionEntity,
		securityTransactionsQueryParameters, 
		setSecurityTransactionsQueryParameters,
		reloadSecurityTransactions: fetchData
	};
};
