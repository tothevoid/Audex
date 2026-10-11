import { Box, Button, Checkbox, Icon, Text } from "@chakra-ui/react";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import { getCurrencies, updateCurrency, createCurrency, deleteCurrency, syncRates } from "@/api/currencies/currencyApi";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import CurrencyModal from "@/pages/Data/modals/CurrencyModal/CurrencyModal";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import RefreshButton from "@/shared/components/RefreshButton/RefreshButton";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";

const CurrenciesTable: React.FC = () => {
    const [currencies, setCurrencies] = useState<CurrencyEntity[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [currencyToDelete, setCurrencyToDelete] = useState<CurrencyEntity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();
    
    const { user } = useUserProfile();

    const [isSyncing, setSyncing] = useState(false);

    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => { 
        setIsLoading(true);
        try {
            const fetchedCurrencies = await getCurrencies();
            setCurrencies(fetchedCurrencies);
        } finally {
            setIsLoading(false);
        }
    };

    const onActiveChanged = useCallback((currencyId: string, newValue: boolean) => {
        setCurrencies((currentCurrencies) => {
            let hasNewChanges = false;
            const updatedCurrencies = currentCurrencies.map((currencyItem: CurrencyEntity) => {
                if (currencyItem.id !== currencyId || currencyItem.active === newValue) {
                    return currencyItem;
                }

                hasNewChanges = true;
                return { ...currencyItem, active: newValue };
            });

            if (!hasNewChanges) {
                return currentCurrencies;
            }

            setHasChanges(true);
            return updatedCurrencies;
        });
    }, []);

    const onCellBlur = useCallback(async (currencyId: string) => {
        if (!hasChanges) {
            return;
        }

        const currency = currencies.find((currencyItem: CurrencyEntity) => currencyItem.id === currencyId);
        if (!currency) {
            return;
        }

        await updateCurrency({ ...currency });
        setHasChanges(false);
    }, [currencies, hasChanges]);
    
    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onCurrencyAdded = async (currency: CurrencyEntity) => {
        const createdCurrencyId = await createCurrency(currency);
        if (!createdCurrencyId) {
            return;
        }

        currency.id = createdCurrencyId;

        notify.success(t("currency_toast_created_title"), t("currency_toast_created_desc", { name: currency.name }));

        setCurrencies((currentCurrencies) => [...currentCurrencies, currency]);
    };

    const onDeleteClicked = (currency: CurrencyEntity) => {
        setCurrencyToDelete(currency);
        confirmModalRef.current?.openModal();
    };

    const onDeleteConfirmed = async () => {
        if (!currencyToDelete) {
            return;
        }

        const isDeleted = await deleteCurrency(currencyToDelete.id);
        
        if (!isDeleted) {
            return;
        }

        notify.success(t("currency_toast_deleted_title"), t("currency_toast_deleted_desc", { name: currencyToDelete.name }));

        setCurrencies((currentCurrencies) => currentCurrencies.filter((currencyItem: CurrencyEntity) => currencyItem.id !== currencyToDelete.id));
        setCurrencyToDelete(null);
    };

    const onSyncRates = async () => {
        setSyncing(true);
        await syncRates();
        await fetchCurrencies();
        setSyncing(false);
    };

    const columns: ColumnDef<CurrencyEntity>[] = useMemo(() => [
        {
            header: t("entity_currency_name"),
            render: (currency) => <Text>{currency.name}</Text>
        },
        {
            header: t("entity_currency_rate"),
            render: (currency) => (
                <Text>{formatMoneyByCurrencyCulture(1, currency.name)} = {formatMoneyByCurrencyCulture(currency.rate, user?.currency.name, 3)}</Text>
            )
        },
        {
            header: t("entity_currency_active"),
            width: 10,
            render: (currency) => (
                <Checkbox.Root onBlur={() => onCellBlur(currency.id)} checked={currency.active} variant="subtle"
                    onCheckedChange={(data) => {onActiveChanged(currency.id, !!data.checked);}}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
            )
        },
        {
            width: 10,
            render: (currency) => (
                <Button borderColor="background_secondary" background="button_background_secondary" size={'sm'} onClick={() => onDeleteClicked(currency)}>
                    <Icon color="card_action_icon_danger">
                        <MdDelete/>
                    </Icon>
                </Button>
            )
        }
    ], [t, user, onActiveChanged, onCellBlur]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_currencies")}
            onAdd={onAdd}
            addButtonTitle={t("currencies_data_add")}
            extra={
                <RefreshButton isRefreshing={isSyncing} title={t("currencies_data_sync_rates")} onClick={onSyncRates} />
            }
        />
        <DataTable
            data={currencies}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <CurrencyModal modalRef={modalRef} onSaved={onCurrencyAdded}/>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("currencies_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
    </Box>;
};

export default CurrenciesTable;