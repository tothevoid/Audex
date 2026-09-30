import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createBrokerAccountTaxDeduction, deleteBrokerAccountTaxDeduction, getBrokerAccountTaxDeductions, updateBrokerAccountTaxDeduction } from "@/api/brokers/brokerAccountTaxDeductionApi";
import { BrokerAccountTaxDeductionEntity, TaxDeductionsQuery } from "@/models/brokers/BrokerAccountTaxDeductionEntity";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export type { TaxDeductionsQuery };

export const useBrokerAccountTaxDeductions = (
    queryParameters: TaxDeductionsQuery
) => {
    const { t } = useTranslation();
    const [taxDeductions, setTaxDeductions] = useState<BrokerAccountTaxDeductionEntity[]>([]);
    const [isTaxDeductionsLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taxDeductionsQueryParameters, setTaxDeductionsQueryParameters] = useState<TaxDeductionsQuery>(queryParameters);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const deductions = await getBrokerAccountTaxDeductions(taxDeductionsQueryParameters);
            setTaxDeductions(deductions);
        } catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
        } finally {
            setLoading(false);
        }
    }, [taxDeductionsQueryParameters, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createTaxDeductionEntity = async (createdTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        await createBrokerAccountTaxDeduction(createdTaxDeduction);
        await fetchData();
    };

    const updateTaxDeductionEntity = async (updatedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        await updateBrokerAccountTaxDeduction(updatedTaxDeduction);
        await fetchData();
    };

    const deleteTaxDeductionEntity = async (deletedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        const taxDeductionDeleted = await deleteBrokerAccountTaxDeduction(deletedTaxDeduction.id);
        if (!taxDeductionDeleted) {
            return;
        }
        await fetchData();
    };

    return {
        taxDeductions,
        isTaxDeductionsLoading,
        error,
        createTaxDeductionEntity,
        updateTaxDeductionEntity,
        deleteTaxDeductionEntity,
        refetch: fetchData,
        reloadTaxDeductions: fetchData,
        taxDeductionsQueryParameters,
        setTaxDeductionsQueryParameters
    };
};
