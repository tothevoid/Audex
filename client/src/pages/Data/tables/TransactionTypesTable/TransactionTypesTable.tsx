import { Box, Button, Checkbox, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit, MdOutlinePayment } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { TransactionTypeEntity } from "../../../../models/transactions/TransactionTypeEntity";
import { createTransactionType, deleteTransactionType, getTransactionTypeIconUrl, getTransactionTypes, updateTransactionType } from "../../../../api/transactions/transactionTypeApi";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import TransactionTypeModal from "../../modals/TransactionTypeModal/TransactionTypeModal";
import AddButton from "../../../../shared/components/AddButton/AddButton";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import StoredIcon from "../../../../shared/components/StoredIcon";

interface State {
    transactionTypes: TransactionTypeEntity[]
}

const TransactionTypesTable: React.FC = () => {
    const [state, setState] = useState<State>({
        transactionTypes: []});
    const [isLoading, setIsLoading] = useState(true);

    const [transactionTypeToDeleteId, setTransactionTypeToDeleteId] = useState<string | null>();
    const [updatedTransactionType, setUpdatedTransactionType] = useState<TransactionTypeEntity | null>();

    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        const initData = async () => { 
            setIsLoading(true);
            try {
                const transactionTypes = await getTransactionTypes();
                setState((currentState) => {
                    return {...currentState, transactionTypes}
                });
            } finally {
                setIsLoading(false);
            }
        }

        initData();
    }, []);

    useEffect(() => {
        if (transactionTypeToDeleteId) {
            confirmModalRef.current?.openModal();
        }
    }, [transactionTypeToDeleteId]);

    useEffect(() => {
        if (updatedTransactionType) {
            modalRef.current?.openModal(); 
        }
    }, [updatedTransactionType]);
    
    const onAdd = () => {
        modalRef.current?.openModal()
    };

    const onEditClicked = (transactionType: TransactionTypeEntity) => {
        setUpdatedTransactionType(transactionType);
    }

    const onTransactionTypeSaved = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const isModified = state.transactionTypes
            .findIndex(transactionType => transactionType.id === savedTransactionType.id) >= 0;

        if (isModified) {
            await onTransactionTypeUpdated(savedTransactionType, icon);
        } else {
            await onTransactionTypeAdded(savedTransactionType, icon);
        }
    };

    const onTransactionTypeAdded = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const addedTransactionType = await createTransactionType(savedTransactionType, icon);
        if (!addedTransactionType) {
            return;
        }

        setState((currentState) => {
            return {...currentState, transactionTypes: [...currentState.transactionTypes, addedTransactionType]}
        })
    }

    const onTransactionTypeUpdated = async (savedTransactionType: TransactionTypeEntity, icon: File | null) => {
        const updatedTransactionType = await updateTransactionType(savedTransactionType, icon);
        if (!updatedTransactionType) {
            return;
        }

        setState((currentState) => {
            return {...currentState, transactionTypes: currentState.transactionTypes.map(transactionType => 
                transactionType.id !== savedTransactionType.id ?
                    transactionType:
                    updatedTransactionType
            )}
        })
    }

    const onDeleteClicked = async (transactionType: TransactionTypeEntity) => {
        setTransactionTypeToDeleteId(transactionType.id)
    }

    const onDeleteConfirmed = async () => {
        if (!transactionTypeToDeleteId){
            return;
        }

        const isDeleted = await deleteTransactionType(transactionTypeToDeleteId);
        
        if (!isDeleted) {
            return;
        }

        const transactionTypes = state.transactionTypes.filter((transactionType: TransactionTypeEntity) => {
            return transactionType.id !== transactionTypeToDeleteId;
        });

        setState((currentState) => {
            return {...currentState, transactionTypes: transactionTypes}
        })
        setTransactionTypeToDeleteId(null);
    }

    const onModalClosed = () => {
        setUpdatedTransactionType(null);
    }

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
    ], [t, state.transactionTypes]);

    return <Box color="text_primary">
        <Box mb={4}>
            <AddButton buttonTitle={t("transaction_type_data_add")} onClick={onAdd}/>
        </Box>
        <DataTable
            data={state.transactionTypes}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <TransactionTypeModal onModalClosed={onModalClosed} transactionType={updatedTransactionType} modalRef={modalRef} onSaved={onTransactionTypeSaved}/>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("transaction_type_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
    </Box>
}

export default TransactionTypesTable;