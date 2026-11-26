import { Box, Text } from "@chakra-ui/react";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import CurrencyModal from "@/pages/Data/modals/CurrencyModal/CurrencyModal";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import RefreshButton from "@/shared/components/RefreshButton/RefreshButton";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import DataTableActiveCheckbox from "@/shared/components/DataTable/DataTableActiveCheckbox";
import DataTableNameCell from "@/shared/components/DataTable/DataTableNameCell";
import DataTableRowActions from "@/shared/components/DataTable/DataTableRowActions";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import DataTableFilterBar from "@/pages/Data/components/DataTableFilterBar/DataTableFilterBar";
import { useDataTableFilter } from "@/pages/Data/hooks/useDataTableFilter";
import { notify } from "@/shared/components/Toaster";
import {
    useCurrencies,
    useCreateCurrencyMutation,
    useDeleteCurrencyMutation,
    useSyncCurrencyRatesMutation,
    useUpdateCurrencyMutation,
} from "@/shared/hooks/queries/useCurrencies";

const FILTER_OPTIONS = { hasActiveFilter: true };

const CurrenciesTable: React.FC = () => {
    const { data: currencies = [], isLoading } = useCurrencies();
    const {
        filteredItems: filteredCurrencies,
        searchText,
        onSearchTextChanged,
        onlyActive,
        onOnlyActiveChanged,
        showSearch,
        showActiveFilter,
    } = useDataTableFilter(currencies, FILTER_OPTIONS);
    const createCurrencyMutation = useCreateCurrencyMutation();
    const updateCurrencyMutation = useUpdateCurrencyMutation();
    const deleteCurrencyMutation = useDeleteCurrencyMutation();
    const syncRatesMutation = useSyncCurrencyRatesMutation();

    const { t } = useTranslation();
    const { user } = useUserProfile();
    const { confirmDelete } = useConfirm();

    const modalRef = useRef<BaseModalRef>(null);

    const onActiveChanged = useCallback(async (currency: CurrencyEntity, isChecked: boolean) => {
        if (currency.active === isChecked) {
            return;
        }

        const result = await updateCurrencyMutation.mutateAsync({ ...currency, active: isChecked });
        if (!result.isSuccess) {
            notify.error(t("toast_error_title"), result.errorMessage);
        }
    }, [updateCurrencyMutation, t]);

    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onCurrencyAdded = async (currency: CurrencyEntity) => {
        const result = await createCurrencyMutation.mutateAsync(currency);
        if (!result.isSuccess) {
            notify.error(t("toast_error_title"), result.errorMessage);
            return;
        }

        notify.success(t("currency_toast_created_title"), t("currency_toast_created_desc", { name: currency.name }));
    };

    const onDeleteClicked = useCallback(async (currency: CurrencyEntity) => {
        const confirmed = await confirmDelete(t("currencies_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteCurrencyMutation.mutateAsync(currency.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("currency_toast_deleted_title"), t("currency_toast_deleted_desc", { name: currency.name }));
    }, [confirmDelete, deleteCurrencyMutation, t]);

    const onSyncRates = async () => {
        await syncRatesMutation.mutateAsync();
    };

    const columns: ColumnDef<CurrencyEntity>[] = useMemo(() => [
        {
            header: t("entity_currency_name"),
            render: (currency) => <DataTableNameCell name={currency.name} />,
        },
        {
            header: t("entity_currency_rate"),
            render: (currency) => (
                <Text>{formatMoneyByCurrencyCulture(1, currency.name)} = {formatMoneyByCurrencyCulture(currency.rate, user?.currency.name, 3)}</Text>
            ),
        },
        {
            header: t("entity_currency_active"),
            width: 10,
            render: (currency) => (
                <DataTableActiveCheckbox
                    checked={currency.active}
                    disabled={updateCurrencyMutation.isPending}
                    onChange={(isChecked) => onActiveChanged(currency, isChecked)}
                />
            ),
        },
        {
            width: "1%",
            align: "end",
            render: (currency) => (
                <DataTableRowActions
                    onDelete={() => onDeleteClicked(currency)}
                />
            ),
        },
    ], [t, user, onActiveChanged, onDeleteClicked, updateCurrencyMutation.isPending]);

    return (
        <Box color="text_primary">
            <SectionHeader
                title={t("data_tab_currencies")}
                onAdd={onAdd}
                addButtonTitle={t("currencies_data_add")}
                extra={
                    <RefreshButton
                        isRefreshing={syncRatesMutation.isPending}
                        title={t("currencies_data_sync_rates")}
                        onClick={onSyncRates}
                    />
                }
            />
            <DataTableFilterBar
                showSearch={showSearch}
                searchText={searchText}
                onSearchTextChanged={onSearchTextChanged}
                showActiveFilter={showActiveFilter}
                onlyActive={onlyActive}
                onOnlyActiveChanged={onOnlyActiveChanged}
            />
            <DataTable
                data={filteredCurrencies}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                skeletonRows={5}
            />
            <CurrencyModal modalRef={modalRef} onSaved={onCurrencyAdded} />
        </Box>
    );
};

export default CurrenciesTable;
