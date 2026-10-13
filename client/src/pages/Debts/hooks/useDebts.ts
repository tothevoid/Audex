import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DebtEntity } from "@/models/debts/DebtEntity";
import { createDebt, deleteDebt, getDebts, updateDebt } from "@/api/debts/debtApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useDebts = () => {
	const { t } = useTranslation();
	const [debts, setDebts] = useState<DebtEntity[]>([]);
	const [isDebtsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadDebts = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const debts = await getDebts(false);
				if (isMounted) {
					setDebts(debts);
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

	const createDebtEntity = async (debt: DebtEntity) => {
		const added = await createDebt(debt);
		if (!added) {
			return;
		}

		reloadDebts();
		notify.success(
			t("debts_toast_created_title"),
			t("debts_toast_created_desc", { name: debt.name })
		);
	};

	const updateDebtEntity = async (updatedDebt: DebtEntity) => {
		const debtUpdated = await updateDebt(updatedDebt);
		if (!debtUpdated) {
			return;
		}

		reloadDebts();

		notify.success(
			t("debts_toast_updated_title"),
			t("debts_toast_updated_desc", { name: updatedDebt.name })
		);
	};

	const deleteDebtEntity = async (deletedDebt: DebtEntity) => {
		const debtDeleted = await deleteDebt(deletedDebt.id);
		if (!debtDeleted) {
			return;
		}

		const updatedDebts = debts.filter(debt => debt.id !== deletedDebt.id);
		setDebts(updatedDebts);
		notify.success(
			t("debts_toast_deleted_title"),
			t("debts_toast_deleted_desc", { name: deletedDebt.name })
		);
	};

	return {
		debts,
		isDebtsLoading,
		error,
		createDebtEntity,
		updateDebtEntity,
		deleteDebtEntity,
		reloadDebts
	};
};
