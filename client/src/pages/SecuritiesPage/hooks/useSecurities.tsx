import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SecurityEntity } from "@/models/securities/SecurityEntity";
import { createSecurity, deleteSecurity, getSecurities, updateSecurity } from "@/api/securities/securityApi";
import { OperationResult } from "@/shared/models/OperationResult";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useSecurities = () => {
	const { t } = useTranslation();
	const [securities, setSecurities] = useState<SecurityEntity[]>([]);
	const [isSecuritiesLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const accounts = await getSecurities();
			setSecurities(accounts);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createSecurityEntity = async (createdSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await createSecurity(createdSecurity, icon);
		if (result.isSuccess) {
			await fetchData();
		}
		return result;
	};

	const updateSecurityEntity = async (updatedSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await updateSecurity(updatedSecurity, icon);
		if (result.isSuccess) {
			await fetchData();
		}
		return result;
	};

	const deleteSecurityEntity = async (deletedSecurity: SecurityEntity) => {
		const isAccountDeleted = await deleteSecurity(deletedSecurity.id);
		if (!isAccountDeleted) {
			return;
		}

		await fetchData();
	};

	return {
		securities,
		isSecuritiesLoading,
		error,
		createSecurityEntity,
		updateSecurityEntity,
		deleteSecurityEntity,
		reloadSecurities: fetchData
	};
};
