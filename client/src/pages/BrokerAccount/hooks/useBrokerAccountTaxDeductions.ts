import { useCallback, useEffect, useState } from "react";
import { createBrokerAccountTaxDeduction, deleteBrokerAccountTaxDeduction, getBrokerAccountTaxDeductions, updateBrokerAccountTaxDeduction } from "@/api/brokers/brokerAccountTaxDeductionApi";
import { BrokerAccountTaxDeductionEntity, TaxDeductionsQuery } from "@/models/brokers/BrokerAccountTaxDeductionEntity";

export type { TaxDeductionsQuery };

export const useBrokerAccountTaxDeductions = (
    queryParameters: TaxDeductionsQuery, 
    onDataChanged?: () => void
) => {
    const [taxDeductions, setTaxDeductions] = useState<BrokerAccountTaxDeductionEntity[]>([]);
    const [isTaxDeductionsLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taxDeductionsQueryParameters, setTaxDeductionsQueryParameters] = useState<TaxDeductionsQuery>(queryParameters);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const deductions = await getBrokerAccountTaxDeductions(taxDeductionsQueryParameters);
            setTaxDeductions(deductions);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, [taxDeductionsQueryParameters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createTaxDeductionEntity = async (createdTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        await createBrokerAccountTaxDeduction(createdTaxDeduction);
        await fetchData();
        onDataChanged?.();
    };

    const updateTaxDeductionEntity = async (updatedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        await updateBrokerAccountTaxDeduction(updatedTaxDeduction);
        await fetchData();
        onDataChanged?.();
    };

    const deleteTaxDeductionEntity = async (deletedTaxDeduction: BrokerAccountTaxDeductionEntity) => {
        const taxDeductionDeleted = await deleteBrokerAccountTaxDeduction(deletedTaxDeduction.id);
        if (!taxDeductionDeleted) {
            return;
        }
        await fetchData();
        onDataChanged?.();
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
