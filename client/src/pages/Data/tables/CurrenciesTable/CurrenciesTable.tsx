import { Box, Button, Checkbox, Icon, Text } from "@chakra-ui/react";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { useCallback, useMemo, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import CurrencyModal from "@/pages/Data/modals/CurrencyModal/CurrencyModal";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import RefreshButton from "@/shared/components/RefreshButton/RefreshButton";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";
import {
    useCurrencies,
    useCreateCurrencyMutation,
    useDeleteCurrencyMutation,
    useSyncCurrencyRatesMutation,
    useUpdateCurrencyMutation,
} from "@/shared/hooks/queries/useCurrencies";

const CurrenciesTable: React.FC = () => {
    const { data: currencies = [], isLoading } = useCurrencies();
    const createCurrencyMutation = useCreateCurrencyMutation();
    const updateCurrencyMutation = useUpdateCurrencyMutation();
    const deleteCurrencyMutation = useDeleteCurrencyMutation();
    const syncRatesMutation = useSyncCurrencyRatesMutation();

    const [currencyToDelete, setCurrencyToDelete] = useState<CurrencyEntity | null>(null);
    const { t } = useTranslation();
    const { user } = useUserProfile();

    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    const onActiveChanged = useCallback(async (currency: CurrencyEntity, isChecked: boolean) => {
        if (currency.active === isChecked) {
            return;
        }

        await updateCurrencyMutation.mutateAsync({ ...currency, active: isChecked });
    }, [updateCurrencyMutation]);

    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onCurrencyAdded = async (currency: CurrencyEntity) => {
        const createdCurrencyId = await createCurrencyMutation.mutateAsync(currency);
        if (!createdCurrencyId) {
            return;
        }

        notify.success(t("currency_toast_created_title"), t("currency_toast_created_desc", { name: currency.name }));
    };

    const onDeleteClicked = (currency: CurrencyEntity) => {
        setCurrencyToDelete(currency);
        confirmModalRef.current?.openModal();
    };

    const onDeleteConfirmed = async () => {
        if (!currencyToDelete) {
            return;
        }

        const isDeleted = await deleteCurrencyMutation.mutateAsync(currencyToDelete.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("currency_toast_deleted_title"), t("currency_toast_deleted_desc", { name: currencyToDelete.name }));
        setCurrencyToDelete(null);
    };

    const onSyncRates = async () => {
        await syncRatesMutation.mutateAsync();
    };

    const columns: ColumnDef<CurrencyEntity>[] = useMemo(() => [
        {
            header: t("entity_currency_name"),
            render: (currency) => <Text>{currency.name}</Text>,
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
                <Checkbox.Root
                    checked={currency.active}
                    variant="subtle"
                    onCheckedChange={(eventDetails) => {
                        onActiveChanged(currency, Boolean(eventDetails.checked));
                    }}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
            ),
        },
        {
            width: 10,
            render: (currency) => (
                <Button borderColor="background_secondary" background="button_background_secondary" size="sm" onClick={() => onDeleteClicked(currency)}>
                    <Icon color="card_action_icon_danger">
                        <MdDelete />
                    </Icon>
                </Button>
            ),
        },
    ], [t, user, onActiveChanged]);

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
            <DataTable
                data={currencies}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                skeletonRows={5}
            />
            <CurrencyModal modalRef={modalRef} onSaved={onCurrencyAdded} />
            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("currencies_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
        </Box>
    );
};

export default CurrenciesTable;
