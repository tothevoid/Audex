import { Box } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { BrokerEntity } from "@/models/brokers/BrokerEntity";
import BrokerModal from "@/pages/Data/modals/BrokerModal/BrokerModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import DataTableActiveCheckbox from "@/shared/components/DataTable/DataTableActiveCheckbox";
import DataTableNameCell from "@/shared/components/DataTable/DataTableNameCell";
import DataTableRowActions from "@/shared/components/DataTable/DataTableRowActions";
import DataTableFilterBar from "@/pages/Data/components/DataTableFilterBar/DataTableFilterBar";
import { useDataTableFilter } from "@/pages/Data/hooks/useDataTableFilter";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";
import {
    useBrokers,
    useCreateBrokerMutation,
    useDeleteBrokerMutation,
    useUpdateBrokerMutation,
} from "@/shared/hooks/queries/useBrokers";

const FILTER_OPTIONS = { hasActiveFilter: true };

const BrokersTable: React.FC = () => {
    const { data: brokers = [], isLoading } = useBrokers();
    const {
        filteredItems: filteredBrokers,
        searchText,
        onSearchTextChanged,
        onlyActive,
        onOnlyActiveChanged,
        showSearch,
        showActiveFilter,
    } = useDataTableFilter(brokers, FILTER_OPTIONS);
    const createBrokerMutation = useCreateBrokerMutation();
    const updateBrokerMutation = useUpdateBrokerMutation();
    const deleteBrokerMutation = useDeleteBrokerMutation();

    const [updatedBroker, setUpdatedBroker] = useState<BrokerEntity | null>(null);
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const modalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        if (updatedBroker) {
            modalRef.current?.openModal();
        }
    }, [updatedBroker]);
    
    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onEditClicked = useCallback((broker: BrokerEntity) => {
        setUpdatedBroker(broker);
    }, []);

    const onModalClosed = () => {
        setUpdatedBroker(null);
    };

    const onActiveChanged = useCallback(async (broker: BrokerEntity, isChecked: boolean) => {
        if (broker.active === isChecked) {
            return;
        }

        const isUpdated = await updateBrokerMutation.mutateAsync({ ...broker, active: isChecked });
        if (isUpdated) {
            notify.success(t("broker_toast_updated_title"), t("broker_toast_updated_desc", { name: broker.name }));
        }
    }, [updateBrokerMutation, t]);

    const onBrokerSaved = async (savedBroker: BrokerEntity) => {
        const isModified = brokers.some((brokerItem: BrokerEntity) => brokerItem.id === savedBroker.id);

        if (isModified) {
            const isUpdated = await updateBrokerMutation.mutateAsync(savedBroker);
            if (isUpdated) {
                notify.success(t("broker_toast_updated_title"), t("broker_toast_updated_desc", { name: savedBroker.name }));
            }
        } else {
            const createdBroker = await createBrokerMutation.mutateAsync(savedBroker);
            if (createdBroker) {
                notify.success(t("broker_toast_created_title"), t("broker_toast_created_desc", { name: createdBroker.name }));
            }
        }
    };

    const onDeleteClicked = useCallback(async (broker: BrokerEntity) => {
        const confirmed = await confirmDelete(t("brokers_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteBrokerMutation.mutateAsync(broker.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("broker_toast_deleted_title"), t("broker_toast_deleted_desc", { name: broker.name }));
    }, [confirmDelete, deleteBrokerMutation, t]);

    const columns: ColumnDef<BrokerEntity>[] = useMemo(() => [
        {
            header: t("entity_broker_name"),
            render: (broker) => <DataTableNameCell name={broker.name} />
        },
        {
            header: t("entity_broker_active"),
            width: 10,
            render: (broker) => (
                <DataTableActiveCheckbox
                    checked={broker.active}
                    disabled={updateBrokerMutation.isPending}
                    onChange={(isChecked) => onActiveChanged(broker, isChecked)}
                />
            )
        },
        {
            width: "1%",
            align: "end",
            render: (broker) => (
                <DataTableRowActions
                    onEdit={() => onEditClicked(broker)}
                    onDelete={() => onDeleteClicked(broker)}
                />
            )
        }
    ], [onDeleteClicked, onEditClicked, onActiveChanged, updateBrokerMutation.isPending, t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_brokers")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_add")}
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
            data={filteredBrokers}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <BrokerModal
            onModalClosed={onModalClosed}
            broker={updatedBroker}
            modalRef={modalRef}
            onSaved={onBrokerSaved}
        />
    </Box>;
};

export default BrokersTable;
