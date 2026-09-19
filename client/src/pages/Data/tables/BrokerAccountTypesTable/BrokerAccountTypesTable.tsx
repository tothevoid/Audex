import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import BrokerAccountTypeModal from "../../modals/BrokerAccountTypeModal/BrokerAccountTypeModal";
import { createBrokerAccountType, deleteBrokerAccountType, getBrokerAccountTypes, updateBrokerAccountType } from "../../../../api/brokers/brokerAccountTypeApi";
import { BrokerAccountTypeEntity } from "../../../../models/brokers/BrokerAccountTypeEntity";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import SectionHeader from "../../../../shared/components/SectionHeader/SectionHeader";

interface State {
    brokerAccountTypes: BrokerAccountTypeEntity[],
    currentBrokerAccountTypeId: string | null
}

const BrokerAccountTypesTable: React.FC = () => {
    const [state, setState] = useState<State>({brokerAccountTypes: [], currentBrokerAccountTypeId: null});
    const [isLoading, setIsLoading] = useState(true);
    const [updatedBrokerAccountType, setUpdatedBrokerAccountType] = useState<BrokerAccountTypeEntity | null>(null);
    const { t } = useTranslation();

    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        const initData = async () => { 
            setIsLoading(true);
            try {
                const brokerAccountTypes = await getBrokerAccountTypes();
                setState((currentState) => {
                    return {...currentState, brokerAccountTypes}
                });
            } finally {
                setIsLoading(false);
            }
        }

        initData();
    }, []);

    useEffect(() => {
        if (updatedBrokerAccountType) {
            modalRef.current?.openModal();
        }
    }, [updatedBrokerAccountType]);
    
    const onAdd = () => {
        modalRef.current?.openModal()
    };

    const onEditClicked = (brokerAccountType: BrokerAccountTypeEntity) => {
        setUpdatedBrokerAccountType(brokerAccountType);
    };

    const onModalClosed = () => {
        setUpdatedBrokerAccountType(null);
    };

    const onBrokerAccountTypeSaved = async (savedAccountType: BrokerAccountTypeEntity) => {
        const isModified = state.brokerAccountTypes.some(b => b.id === savedAccountType.id);

        if (isModified) {
            await updateBrokerAccountType(savedAccountType);
            setState((currentState) => ({
                ...currentState,
                brokerAccountTypes: currentState.brokerAccountTypes.map(b => b.id === savedAccountType.id ? savedAccountType : b)
            }));
        } else {
            const createdBrokerAccountType = await createBrokerAccountType(savedAccountType);
            if (!createdBrokerAccountType) {
                return;
            }
            setState((currentState) => ({
                ...currentState,
                brokerAccountTypes: [...currentState.brokerAccountTypes, createdBrokerAccountType]
            }));
        }
    };

    const onDeleteClicked = async (brokerAccountType: BrokerAccountTypeEntity) => {
        setState((currentState) => {
            return {...currentState, currentBrokerAccountTypeId: brokerAccountType.id}
        })
        confirmModalRef.current?.openModal()
    }

    const onDeleteConfirmed = async () => {
        const {currentBrokerAccountTypeId} = state;

        if (!currentBrokerAccountTypeId){
            return;
        }

        const isDeleted = await deleteBrokerAccountType(currentBrokerAccountTypeId);
        
        if (!isDeleted) {
            return;
        }

        const brokerAccountTypes = state.brokerAccountTypes.filter((brokerAccountType: BrokerAccountTypeEntity) => {
            return brokerAccountType.id !== state.currentBrokerAccountTypeId;
        });

        setState((currentState) => {
            return {...currentState, brokerAccountTypes, currentBrokerAccountTypeId: null}
        })
    }

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
    ], [t, state.brokerAccountTypes]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_broker_account_types")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_account_type_add")}
        />
        <DataTable
            data={state.brokerAccountTypes}
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
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("broker_account_types_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
    </Box>
}

export default BrokerAccountTypesTable;