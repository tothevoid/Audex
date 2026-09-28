import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createSecurityTransaction, deleteSecurityTransaction, getSecurityTransactions, updateSecurityTransaction } from "@/api/securities/securityTransactionApi";
import { SecurityTransactionEntity, SecurityTransactionEntityRequest } from "@/models/securities/SecurityTransactionEntity";
import { Nullable } from "@/shared/utilities/nullable";
import {
	createDefaultSecurityTransactionsRequest,
	SecurityTransactionsRequest
} from "@/models/securities/SecurityTransactionsRequest";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useSecurityTransactions = (brokerAccountId: Nullable<string>) => {
	const { t } = useTranslation();
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
		} catch (exception: unknown) {
			setError(parseErrorMessage(exception, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [securityTransactionsQueryParameters, t]);

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
