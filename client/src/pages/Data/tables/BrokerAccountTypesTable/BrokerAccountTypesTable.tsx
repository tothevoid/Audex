import { Box } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import BrokerAccountTypeModal from "@/pages/Data/modals/BrokerAccountTypeModal/BrokerAccountTypeModal";
import { BrokerAccountTypeEntity } from "@/models/brokers/BrokerAccountTypeEntity";
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
    useBrokerAccountTypes,
    useCreateBrokerAccountTypeMutation,
    useDeleteBrokerAccountTypeMutation,
    useUpdateBrokerAccountTypeMutation,
} from "@/shared/hooks/queries/useBrokerAccountTypes";

const FILTER_OPTIONS = { hasActiveFilter: true };

const BrokerAccountTypesTable: React.FC = () => {
    const { data: brokerAccountTypes = [], isLoading } = useBrokerAccountTypes();
    const {
        filteredItems: filteredBrokerAccountTypes,
        searchText,
        onSearchTextChanged,
        onlyActive,
        onOnlyActiveChanged,
        showSearch,
        showActiveFilter,
    } = useDataTableFilter(brokerAccountTypes, FILTER_OPTIONS);
    const createBrokerAccountTypeMutation = useCreateBrokerAccountTypeMutation();
    const updateBrokerAccountTypeMutation = useUpdateBrokerAccountTypeMutation();
    const deleteBrokerAccountTypeMutation = useDeleteBrokerAccountTypeMutation();

    const [updatedBrokerAccountType, setUpdatedBrokerAccountType] = useState<BrokerAccountTypeEntity | null>(null);
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const modalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        if (updatedBrokerAccountType) {
            modalRef.current?.openModal();
        }
    }, [updatedBrokerAccountType]);
    
    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onEditClicked = useCallback((brokerAccountType: BrokerAccountTypeEntity) => {
        setUpdatedBrokerAccountType(brokerAccountType);
    }, []);

    const onModalClosed = () => {
        setUpdatedBrokerAccountType(null);
    };

    const onActiveChanged = useCallback(async (brokerAccountType: BrokerAccountTypeEntity, isChecked: boolean) => {
        if (brokerAccountType.active === isChecked) {
            return;
        }

        const isUpdated = await updateBrokerAccountTypeMutation.mutateAsync({ ...brokerAccountType, active: isChecked });
        if (isUpdated) {
            notify.success(t("broker_account_type_toast_updated_title"), t("broker_account_type_toast_updated_desc", { name: brokerAccountType.name }));
        }
    }, [updateBrokerAccountTypeMutation, t]);

    const onBrokerAccountTypeSaved = async (savedAccountType: BrokerAccountTypeEntity) => {
        const isModified = brokerAccountTypes.some((typeItem: BrokerAccountTypeEntity) => typeItem.id === savedAccountType.id);

        if (isModified) {
            const isUpdated = await updateBrokerAccountTypeMutation.mutateAsync(savedAccountType);
            if (isUpdated) {
                notify.success(t("broker_account_type_toast_updated_title"), t("broker_account_type_toast_updated_desc", { name: savedAccountType.name }));
            }
        } else {
            const createdBrokerAccountType = await createBrokerAccountTypeMutation.mutateAsync(savedAccountType);
            if (createdBrokerAccountType) {
                notify.success(t("broker_account_type_toast_created_title"), t("broker_account_type_toast_created_desc", { name: createdBrokerAccountType.name }));
            }
        }
    };

    const onDeleteClicked = useCallback(async (brokerAccountType: BrokerAccountTypeEntity) => {
        const confirmed = await confirmDelete(t("broker_account_types_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteBrokerAccountTypeMutation.mutateAsync(brokerAccountType.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("broker_account_type_toast_deleted_title"), t("broker_account_type_toast_deleted_desc", { name: brokerAccountType.name }));
    }, [confirmDelete, deleteBrokerAccountTypeMutation, t]);

    const columns: ColumnDef<BrokerAccountTypeEntity>[] = useMemo(() => [
        {
            header: t("entity_broker_account_type_name"),
            render: (brokerAccountType) => <DataTableNameCell name={brokerAccountType.name} />
        },
        {
            header: t("entity_broker_account_type_active"),
            width: 10,
            render: (brokerAccountType) => (
                <DataTableActiveCheckbox
                    checked={brokerAccountType.active}
                    disabled={updateBrokerAccountTypeMutation.isPending}
                    onChange={(isChecked) => onActiveChanged(brokerAccountType, isChecked)}
                />
            )
        },
        {
            width: "1%",
            align: "end",
            render: (brokerAccountType) => (
                <DataTableRowActions
                    onEdit={() => onEditClicked(brokerAccountType)}
                    onDelete={() => onDeleteClicked(brokerAccountType)}
                />
            )
        }
    ], [onDeleteClicked, onEditClicked, onActiveChanged, updateBrokerAccountTypeMutation.isPending, t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_broker_account_types")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_account_type_add")}
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
            data={filteredBrokerAccountTypes}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <BrokerAccountTypeModal
            onModalClosed={onModalClosed}
            brokerAccountType={updatedBrokerAccountType}
            modalRef={modalRef}
            onSaved={onBrokerAccountTypeSaved}
        />
    </Box>;
};

export default BrokerAccountTypesTable;
