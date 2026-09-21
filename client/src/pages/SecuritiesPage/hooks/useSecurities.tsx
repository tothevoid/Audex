import { useCallback, useEffect, useState } from "react";
import { SecurityEntity } from "../../../models/securities/SecurityEntity";
import { createSecurity, deleteSecurity, getSecurities, updateSecurity } from "../../../api/securities/securityApi";
import { OperationResult } from "../../../shared/models/OperationResult";

export const useSecurities = () => {
	const [securities, setSecurities] = useState<SecurityEntity[]>([]);
	const [isSecuritiesLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true)
		try {
			const accounts = await getSecurities();
			setSecurities(accounts);
		} catch (err: any) {
			setError(err.message || 'Ошибка загрузки данных')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchData();
	}, [fetchData])

	const createSecurityEntity = async (createdSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await createSecurity(createdSecurity, icon);
		if (result.isSuccess) {
			await fetchData();
		}
		return result;
	}

	const updateSecurityEntity = async (updatedSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
		const result = await updateSecurity(updatedSecurity, icon);
		if (result.isSuccess) {
			await fetchData();
		}
		return result;
	}

	const deleteSecurityEntity = async (deletedSecurity: SecurityEntity) => {
		const isAccountDeleted = await deleteSecurity(deletedSecurity.id);
		if (!isAccountDeleted) {
			return;
		}

		await fetchData();
	}

	return {
		securities,
		isSecuritiesLoading,
		error,
		createSecurityEntity,
		updateSecurityEntity,
		deleteSecurityEntity,
		reloadSecurities: fetchData
	}
}
