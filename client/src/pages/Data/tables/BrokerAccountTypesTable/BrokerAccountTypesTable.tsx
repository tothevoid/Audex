import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import BrokerAccountTypeModal from "@/pages/Data/modals/BrokerAccountTypeModal/BrokerAccountTypeModal";
import { BrokerAccountTypeEntity } from "@/models/brokers/BrokerAccountTypeEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";
import {
    useBrokerAccountTypes,
    useCreateBrokerAccountTypeMutation,
    useDeleteBrokerAccountTypeMutation,
    useUpdateBrokerAccountTypeMutation,
} from "@/shared/hooks/queries/useBrokerAccountTypes";

const BrokerAccountTypesTable: React.FC = () => {
    const { data: brokerAccountTypes = [], isLoading } = useBrokerAccountTypes();
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
            render: (brokerAccountType) => <Text>{brokerAccountType.name}</Text>
        },
        {
            width: 10,
            render: (brokerAccountType) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onEditClicked(brokerAccountType)}
                >
                    <Icon color="card_action_icon_primary">
                        <MdEdit/>
                    </Icon>
                </Button>
            )
        },
        {
            width: 10,
            render: (brokerAccountType) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onDeleteClicked(brokerAccountType)}
                >
                    <Icon color="card_action_icon_danger">
                        <MdDelete/>
                    </Icon>
                </Button>
            )
        }
    ], [onDeleteClicked, onEditClicked, t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_broker_account_types")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_account_type_add")}
        />
        <DataTable
            data={brokerAccountTypes}
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
