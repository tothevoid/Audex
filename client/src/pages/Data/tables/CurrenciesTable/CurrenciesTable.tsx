import { Box, Button, Checkbox, Icon, Text } from "@chakra-ui/react";
import { CurrencyEntity } from "../../../../models/currencies/CurrencyEntity";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { getCurrencies, updateCurrency, createCurrency, deleteCurrency, syncRates } from "../../../../api/currencies/currencyApi";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import CurrencyModal from "../../modals/CurrencyModal/CurrencyModal";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import RefreshButton from "../../../../shared/components/RefreshButton/RefreshButton";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import SectionHeader from "../../../../shared/components/SectionHeader/SectionHeader";

interface State {
    currencies: CurrencyEntity[],
    hasChanges: boolean,
    currentCurrencyId: string | null
}

const CurrenciesTable: React.FC = () => {
    const [state, setState] = useState<State>({currencies: [], hasChanges: false, currentCurrencyId: null});
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
            const currencies = await getCurrencies();
            setState((currentState) => {
                return {...currentState, currencies}
            });
        } finally {
            setIsLoading(false);
        }
    }

    const onActiveChanged = (currencyId: string, newValue: boolean) => {
        let hasChanges = false;

        const updatedCurrencies = state.currencies.map((currency: CurrencyEntity) => {
            if (currency.id !== currencyId || currency.active === newValue) {
                return currency;
            }

            hasChanges = true;
            return {...currency, active: newValue};
        });

        if (!hasChanges) {
            return;
        }

        setState((currentState) => {
            return {...currentState, currencies: updatedCurrencies, hasChanges: true}
        })
    }

    const onCellBlur = async (currencyId: string) => {
        if (!state.hasChanges){
            return;
        }

        const currency = state.currencies.find((currency: CurrencyEntity) => {
            return currency.id === currencyId;
        });
        if (!currency) {
            return;
        }

        await updateCurrency({...currency});
    }
    
    const onAdd = () => {
        modalRef.current?.openModal()
    };

    const onCurrencyAdded = async (currency: CurrencyEntity) => {
        const createdCurrencyId = await createCurrency(currency);
        if (!createdCurrencyId) {
            return;
        }

        currency.id = createdCurrencyId;

        setState((currentState) => {
            return {...currentState, currencies: [...currentState.currencies, currency]}
        })
    };

    const onDeleteClicked = async (currency: CurrencyEntity) => {
        setState((currentState) => {
            return {...currentState, currentCurrencyId: currency.id}
        })
        confirmModalRef.current?.openModal()
    }

    const onDeleteConfirmed = async () => {
        const {currentCurrencyId} = state;

        if (!currentCurrencyId){
            return;
        }

        const isDeleted = await deleteCurrency(currentCurrencyId);
        
        if (!isDeleted) {
            return;
        }

        const currencies = state.currencies.filter((currency: CurrencyEntity) => {
            return currency.id !== state.currentCurrencyId;
        });

        setState((currentState) => {
            return {...currentState, currencies, currentCurrencyId: null}
        })
    }

    const onSyncRates = async () => {
        setSyncing(true);
        await syncRates();
        await fetchCurrencies();
        setSyncing(false);
    }

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
                    onCheckedChange={(data) => {onActiveChanged(currency.id, !!data.checked)}}>
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
    ], [t, user, state.currencies]);

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
            data={state.currencies}
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
    </Box>
}

export default CurrenciesTable;