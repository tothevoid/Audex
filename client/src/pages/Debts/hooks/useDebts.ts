import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DebtEntity } from "@/models/debts/DebtEntity";
import { createDebt, deleteDebt, getDebts, updateDebt } from "@/api/debts/debtApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useDebts = () => {
	const { t } = useTranslation();
	const [debts, setDebts] = useState<DebtEntity[]>([]);
	const [isDebtsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const debts = await getDebts(false);
			setDebts(debts);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createDebtEntity = async (debt: DebtEntity) => {
		const added = await createDebt(debt);
		if (!added) {
			return;
		}

		await fetchData();
	};

	const updateDebtEntity = async (updatedDebt: DebtEntity) => {
		const debtUpdated = await updateDebt(updatedDebt);
		if (!debtUpdated) {
			return;
		}

		const updatedDebts = debts.map(existingDebt => 
			updatedDebt.id === existingDebt.id ?
				{...updatedDebt}:
				existingDebt
		);

		setDebts(updatedDebts);
	};

	const deleteDebtEntity = async (deletedDebt: DebtEntity) => {
		const debtDeleted = await deleteDebt(deletedDebt.id);
		if (!debtDeleted) {
			return;
		}

		const updatedDebts = debts.filter(debt => debt.id !== deletedDebt.id);
		setDebts(updatedDebts);
	};

	return {
		debts,
		isDebtsLoading,
		error,
		createDebtEntity,
		updateDebtEntity,
		deleteDebtEntity,
		reloadDebts: fetchData
	};
};
