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

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadSecurities = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const accounts = await getSecurities();
				if (isMounted) {
					setSecurities(accounts);
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
	}, [refreshTrigger, t]);

	const createSecurityEntity = async (createdSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await createSecurity(createdSecurity, icon);
		if (result.isSuccess) {
			reloadSecurities();
		}
		return result;
	};

	const updateSecurityEntity = async (updatedSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await updateSecurity(updatedSecurity, icon);
		if (result.isSuccess) {
			reloadSecurities();
		}
		return result;
	};

	const deleteSecurityEntity = async (deletedSecurity: SecurityEntity) => {
		const isAccountDeleted = await deleteSecurity(deletedSecurity.id);
		if (!isAccountDeleted) {
			return;
		}

		reloadSecurities();
	};

	return {
		securities,
		isSecuritiesLoading,
		error,
		createSecurityEntity,
		updateSecurityEntity,
		deleteSecurityEntity,
		reloadSecurities
	};
};
