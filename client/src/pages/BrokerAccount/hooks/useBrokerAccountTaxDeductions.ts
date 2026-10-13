import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createBrokerAccountTaxDeduction, deleteBrokerAccountTaxDeduction, getBrokerAccountTaxDeductions, updateBrokerAccountTaxDeduction } from "@/api/brokers/brokerAccountTaxDeductionApi";
import { BrokerAccountTaxDeductionEntity, TaxDeductionsQuery } from "@/models/brokers/BrokerAccountTaxDeductionEntity";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export type { TaxDeductionsQuery };

export const useBrokerAccountTaxDeductions = (
    queryParameters: TaxDeductionsQuery
) => {
    const { t } = useTranslation();
    const [taxDeductions, setTaxDeductions] = useState<BrokerAccountTaxDeductionEntity[]>([]);
    const [isTaxDeductionsLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taxDeductionsQueryParameters, setTaxDeductionsQueryParameters] = useState<TaxDeductionsQuery>(queryParameters);

    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadTaxDeductions = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const deductions = await getBrokerAccountTaxDeductions(taxDeductionsQueryParameters);
				if (isMounted) {
					setTaxDeductions(deductions);
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
	}, [taxDeductionsQueryParameters, refreshTrigger, t]);

	const createTaxDeductionEntity = async (createdTaxDeduction: BrokerAccountTaxDeductionEntity) => {
		await createBrokerAccountTaxDeduction(createdTaxDeduction);
		reloadTaxDeductions();
		notify.success(t("taxes_toast_created_title"), t("taxes_toast_created_desc", { name: createdTaxDeduction.name }));
	};

	const updateTaxDeductionEntity = async (updatedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
		await updateBrokerAccountTaxDeduction(updatedTaxDeduction);
		reloadTaxDeductions();
		notify.success(t("taxes_toast_updated_title"), t("taxes_toast_updated_desc", { name: updatedTaxDeduction.name }));
	};

	const deleteTaxDeductionEntity = async (deletedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
		const taxDeductionDeleted = await deleteBrokerAccountTaxDeduction(deletedTaxDeduction.id);
		if (!taxDeductionDeleted) {
			return;
		}
		reloadTaxDeductions();
		notify.success(t("taxes_toast_deleted_title"), t("taxes_toast_deleted_desc", { name: deletedTaxDeduction.name }));
	};

	return {
		taxDeductions,
		isTaxDeductionsLoading,
		error,
		createTaxDeductionEntity,
		updateTaxDeductionEntity,
		deleteTaxDeductionEntity,
		refetch: reloadTaxDeductions,
		reloadTaxDeductions,
		taxDeductionsQueryParameters,
		setTaxDeductionsQueryParameters
	};
};
