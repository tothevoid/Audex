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
import { notify } from "@/shared/components/Toaster";

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

	const createSecurityTransactionEntity = async (createdSecurityTransaction: SecurityTransactionEntityRequest, securityName?: string) => {
		const securityTransaction = await createSecurityTransaction(createdSecurityTransaction);
		if (!securityTransaction) {
			return;
		}
		notify.success(t("security_transactions_toast_created_title"), t("security_transactions_toast_created_desc", { name: securityName ?? "" }));
		await fetchData();
	};

	const updatedSecurityTransactionEntity = async (updatedSecurityTransaction: SecurityTransactionEntityRequest, securityName?: string) => {
		const securityTransactionUpdated = await updateSecurityTransaction(updatedSecurityTransaction);
		if (!securityTransactionUpdated) {
			return;
		}
		notify.success(t("security_transactions_toast_updated_title"), t("security_transactions_toast_updated_desc", { name: securityName ?? "" }));
		await fetchData();
	};

	const deleteSecurityTransactionEntity = async (deletedSecurityTransaction: SecurityTransactionEntity) => {
		const securityTransactionDeleted = await deleteSecurityTransaction(deletedSecurityTransaction.id);
		if (!securityTransactionDeleted) {
			return;
		}
		const name = deletedSecurityTransaction.security?.name ?? "";
		notify.success(t("security_transactions_toast_deleted_title"), t("security_transactions_toast_deleted_desc", { name }));
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
