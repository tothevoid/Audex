import { useCallback, useEffect, useMemo, useState } from "react";
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
	const [queryParameters, setQueryParameters] = useState<SecurityTransactionsRequest>(() =>
		createDefaultSecurityTransactionsRequest(brokerAccountId)
	);

	const effectiveQueryParameters = useMemo<SecurityTransactionsRequest>(() => ({
		...queryParameters,
		brokerAccountId: brokerAccountId ?? queryParameters.brokerAccountId
	}), [brokerAccountId, queryParameters]);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadSecurityTransactions = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const pagedResult = await getSecurityTransactions(effectiveQueryParameters);
				if (isMounted) {
					setSecurityTransactions(pagedResult.items);
					setTotalCount(pagedResult.totalCount);
					setError(null);
				}
			} catch (exception: unknown) {
				if (isMounted) {
					setError(parseErrorMessage(exception, t("error_data_load")));
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
	}, [effectiveQueryParameters, refreshTrigger, t]);

	const createSecurityTransactionEntity = async (createdSecurityTransaction: SecurityTransactionEntityRequest, securityName?: string) => {
		const securityTransaction = await createSecurityTransaction(createdSecurityTransaction);
		if (!securityTransaction) {
			return;
		}
		reloadSecurityTransactions();
		notify.success(t("security_transactions_toast_created_title"), t("security_transactions_toast_created_desc", { name: securityName ?? "" }));
	};

	const updatedSecurityTransactionEntity = async (updatedSecurityTransaction: SecurityTransactionEntityRequest, securityName?: string) => {
		const securityTransactionUpdated = await updateSecurityTransaction(updatedSecurityTransaction);
		if (!securityTransactionUpdated) {
			return;
		}
		reloadSecurityTransactions();
		notify.success(t("security_transactions_toast_updated_title"), t("security_transactions_toast_updated_desc", { name: securityName ?? "" }));
	};

	const deleteSecurityTransactionEntity = async (deletedSecurityTransaction: SecurityTransactionEntity) => {
		const securityTransactionDeleted = await deleteSecurityTransaction(deletedSecurityTransaction.id);
		if (!securityTransactionDeleted) {
			return;
		}
		reloadSecurityTransactions();
		const name = deletedSecurityTransaction.security?.name ?? "";
		notify.success(t("security_transactions_toast_deleted_title"), t("security_transactions_toast_deleted_desc", { name }));
	};

	return {
		securityTransactions,
		totalCount,
		isSecurityTransactionsLoading,
		error,
		createSecurityTransactionEntity,
		updatedSecurityTransactionEntity,
		deleteSecurityTransactionEntity,
		queryParameters: effectiveQueryParameters, 
		setQueryParameters,
		reloadSecurityTransactions
	};
};
