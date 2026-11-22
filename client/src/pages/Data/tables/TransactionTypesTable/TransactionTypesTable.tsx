import { Box, Button, Checkbox, Icon, Text } from "@chakra-ui/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit, MdOutlinePayment } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { TransactionTypeEntity } from "@/models/transactions/TransactionTypeEntity";
import { getTransactionTypeIconUrl } from "@/api/transactions/transactionTypeApi";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import TransactionTypeModal from "@/pages/Data/modals/TransactionTypeModal/TransactionTypeModal";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import StoredIcon from "@/shared/components/StoredIcon";
import { notify } from "@/shared/components/Toaster";
import {
    useCreateTransactionTypeMutation,
    useDeleteTransactionTypeMutation,
    useTransactionTypes,
    useUpdateTransactionTypeMutation,
} from "@/shared/hooks/queries/useTransactionTypes";

const TransactionTypesTable: React.FC = () => {
    const { data: transactionTypes = [], isLoading } = useTransactionTypes();
    const createTransactionTypeMutation = useCreateTransactionTypeMutation();
    const updateTransactionTypeMutation = useUpdateTransactionTypeMutation();
    const deleteTransactionTypeMutation = useDeleteTransactionTypeMutation();

    const [updatedTransactionType, setUpdatedTransactionType] = useState<TransactionTypeEntity | null>();

    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();
    const modalRef = useRef<BaseModalRef>(null);

    const onAdd = useCallback(() => {
        setUpdatedTransactionType(null);
        modalRef.current?.openModal();
    }, []);

    const onEditClicked = useCallback((transactionType: TransactionTypeEntity) => {
        setUpdatedTransactionType(transactionType);
        modalRef.current?.openModal();
    }, []);

    const onTransactionTypeSaved = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const isModified = transactionTypes
            .some(transactionType => transactionType.id === savedTransactionType.id);

        if (isModified) {
            await onTransactionTypeUpdated(savedTransactionType, icon);
        } else {
            await onTransactionTypeAdded(savedTransactionType, icon);
        }
    };

    const onTransactionTypeAdded = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const addedTransactionType = await createTransactionTypeMutation.mutateAsync({
            transactionType: savedTransactionType,
            icon,
        });
        if (!addedTransactionType) {
            return;
        }

        notify.success(t("transaction_type_toast_created_title"), t("transaction_type_toast_created_desc", { name: addedTransactionType.name }));
    };

    const onTransactionTypeUpdated = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const updatedTransactionType = await updateTransactionTypeMutation.mutateAsync({
            transactionType: savedTransactionType,
            icon,
        });
        if (!updatedTransactionType) {
            return;
        }

        notify.success(t("transaction_type_toast_updated_title"), t("transaction_type_toast_updated_desc", { name: updatedTransactionType.name }));
    };

    const onDeleteClicked = useCallback(async (transactionType: TransactionTypeEntity) => {
        const confirmed = await confirmDelete(t("transaction_type_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteTransactionTypeMutation.mutateAsync(transactionType.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("transaction_type_toast_deleted_title"), t("transaction_type_toast_deleted_desc", { name: transactionType.name }));
    }, [confirmDelete, deleteTransactionTypeMutation, t]);

    const onModalClosed = () => {
        setUpdatedTransactionType(null);
    };

    const columns: ColumnDef<TransactionTypeEntity>[] = useMemo(() => [
        {
            width: "40px",
            render: (transactionType) => (
                <StoredIcon
                    src={transactionType.iconKey ? getTransactionTypeIconUrl(transactionType.iconKey) : undefined}
                    fallbackIcon={<MdOutlinePayment size={20} color="var(--chakra-colors-text_secondary)" />}
                    size="md"
                />
            )
        },
        {
            header: t("entity_transaction_type_name"),
            render: (transactionType) => <Text>{transactionType.name}</Text>
        },
        {
            header: t("entity_transaction_type_active"),
            width: 10,
            render: (transactionType) => (
                <Checkbox.Root disabled checked={transactionType.active} variant="subtle">
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
            )
        },
        {
            width: 10,
            render: (transactionType) => (
                <Button borderColor="background_secondary" background="button_background_secondary" size={'sm'} onClick={() => onEditClicked(transactionType)}>
                    <Icon color="card_action_icon_primary">
                        <MdEdit/>
                    </Icon>
                </Button>
            )
        },
        {
            width: 10,
            render: (transactionType) => (
                <Button borderColor="background_secondary" background="button_background_secondary" size={'sm'} onClick={() => onDeleteClicked(transactionType)}>
                    <Icon color="card_action_icon_danger">
                        <MdDelete/>
                    </Icon>
                </Button>
            )
        }
    ], [t, onEditClicked, onDeleteClicked]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_transaction_types")}
            onAdd={onAdd}
            addButtonTitle={t("transaction_type_data_add")}
        />
        <DataTable
            data={transactionTypes}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <TransactionTypeModal onModalClosed={onModalClosed} transactionType={updatedTransactionType} modalRef={modalRef} onSaved={onTransactionTypeSaved}/>
    </Box>;
};

export default TransactionTypesTable;
