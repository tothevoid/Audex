import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DepositEntity } from "@/models/deposits/DepositEntity";
import { createDeposit, deleteDeposit, getDeposits, getDepositsRange, updateDeposit } from "@/api/deposits/depositApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { DepositsRange } from "@/models/deposits/depositsRange";

export interface DepositsFilters {
	selectedMinMonths: number;
	selectedMaxMonths: number;
	onlyActive: boolean;
}

export interface MonthBoundaries {
	minMonths: number;
	maxMonths: number;
}

export interface UseDepositsOptions {
	initialFilters?: Partial<DepositsFilters>;
}

const convertRange = (range: DepositsRange): MonthBoundaries => {
	const minDate = new Date(range.from);
	const minDateMonth = minDate.getMonth() + 1;
	const minMonths = minDate.getFullYear() * 12 + minDateMonth;
	const maxDate = new Date(range.to);
	const maxDateMonth = maxDate.getMonth() + 1;
	const maxMonths = maxDate.getFullYear() * 12 + maxDateMonth;

	return {
		minMonths,
		maxMonths
	};
};

export const useDeposits = (options: UseDepositsOptions = {}) => {
	const { initialFilters } = options;
	const { t } = useTranslation();

	const [deposits, setDeposits] = useState<DepositEntity[]>([]);
	const [boundaries, setBoundaries] = useState<MonthBoundaries | null>(null);
	const [filters, setFilters] = useState<DepositsFilters>({
		selectedMinMonths: initialFilters?.selectedMinMonths ?? 0,
		selectedMaxMonths: initialFilters?.selectedMaxMonths ?? 0,
		onlyActive: initialFilters?.onlyActive ?? true
	});
	const [isDepositsLoading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRangeAndDeposits = useCallback(async () => {
		setLoading(true);
		try {
			const range = await getDepositsRange();
			if (!range) {
				setDeposits([]);
				setBoundaries(null);
				return;
			}

			const serverBoundaries = convertRange(range);
			setBoundaries(serverBoundaries);

			const effectiveMinMonths = initialFilters?.selectedMinMonths || serverBoundaries.minMonths;
			const effectiveMaxMonths = initialFilters?.selectedMaxMonths || serverBoundaries.maxMonths;
			const effectiveActive = initialFilters?.onlyActive ?? true;

			setFilters({
				selectedMinMonths: effectiveMinMonths,
				selectedMaxMonths: effectiveMaxMonths,
				onlyActive: effectiveActive
			});

			const fetchedDeposits = await getDeposits(effectiveMinMonths, effectiveMaxMonths, effectiveActive);
			setDeposits(fetchedDeposits);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [initialFilters?.onlyActive, initialFilters?.selectedMaxMonths, initialFilters?.selectedMinMonths, t]);

	const fetchDepositsOnly = useCallback(async (currentFilters: DepositsFilters) => {
		if (!currentFilters.selectedMinMonths || !currentFilters.selectedMaxMonths) {
			setDeposits([]);
			return;
		}

		setLoading(true);
		try {
			const fetchedDeposits = await getDeposits(
				currentFilters.selectedMinMonths,
				currentFilters.selectedMaxMonths,
				currentFilters.onlyActive
			);
			setDeposits(fetchedDeposits);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchRangeAndDeposits();
	}, [fetchRangeAndDeposits]);

	const updateFilters = useCallback((updates: Partial<DepositsFilters>) => {
		setFilters((prev) => {
			const nextFilters = { ...prev, ...updates };
			fetchDepositsOnly(nextFilters);
			return nextFilters;
		});
	}, [fetchDepositsOnly]);

	const createDepositEntity = async (createdDeposit: DepositEntity) => {
		const addedDeposit = await createDeposit(createdDeposit);
		if (!addedDeposit) return;
		await fetchRangeAndDeposits();
	};

	const updateDepositEntity = async (updatedDeposit: DepositEntity) => {
		const updated = await updateDeposit(updatedDeposit);
		if (!updated) return;
		await fetchRangeAndDeposits();
	};

	const deleteDepositEntity = async (deletedDeposit: DepositEntity) => {
		const deleted = await deleteDeposit(deletedDeposit.id);
		if (!deleted) return;
		await fetchRangeAndDeposits();
	};

	return {
		deposits,
		boundaries,
		filters,
		updateFilters,
		isDepositsLoading,
		error,
		createDepositEntity,
		updateDepositEntity,
		deleteDepositEntity,
		refetch: fetchRangeAndDeposits
	};
};
