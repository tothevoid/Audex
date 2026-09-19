import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { BrokerEntity } from "../../../../models/brokers/BrokerEntity";
import { createBroker, deleteBroker, getBrokers, updateBroker } from "../../../../api/brokers/brokerApi";
import BrokerModal from "../../modals/BrokerModal/BrokerModal";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import SectionHeader from "../../../../shared/components/SectionHeader/SectionHeader";

interface State {
    brokers: BrokerEntity[],
    currentBrokerId: string | null
}

const BrokersTable: React.FC = () => {
    const [state, setState] = useState<State>({brokers: [], currentBrokerId: null});
    const [isLoading, setIsLoading] = useState(true);
    const [updatedBroker, setUpdatedBroker] = useState<BrokerEntity | null>(null);
    const { t } = useTranslation();

    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        const initData = async () => { 
            setIsLoading(true);
            try {
                const brokers = await getBrokers();
                setState((currentState) => {
                    return {...currentState, brokers}
                });
            } finally {
                setIsLoading(false);
            }
        }

        initData();
    }, []);

    useEffect(() => {
        if (updatedBroker) {
            modalRef.current?.openModal();
        }
    }, [updatedBroker]);
    
    const onAdd = () => {
        modalRef.current?.openModal()
    };

    const onEditClicked = (broker: BrokerEntity) => {
        setUpdatedBroker(broker);
    };

    const onModalClosed = () => {
        setUpdatedBroker(null);
    };

    const onBrokerSaved = async (savedBroker: BrokerEntity) => {
        const isModified = state.brokers.some(b => b.id === savedBroker.id);

        if (isModified) {
            await updateBroker(savedBroker);
            setState((currentState) => ({
                ...currentState,
                brokers: currentState.brokers.map(b => b.id === savedBroker.id ? savedBroker : b)
            }));
        } else {
            const createdBroker = await createBroker(savedBroker);
            if (!createdBroker) {
                return;
            }
            setState((currentState) => ({
                ...currentState,
                brokers: [...currentState.brokers, createdBroker]
            }));
        }
    };

    const onDeleteClicked = async (broker: BrokerEntity) => {
        setState((currentState) => {
            return {...currentState, currentBrokerId: broker.id}
        })
        confirmModalRef.current?.openModal()
    }

    const onDeleteConfirmed = async () => {
        const {currentBrokerId} = state;

        if (!currentBrokerId){
            return;
        }

        const isDeleted = await deleteBroker(currentBrokerId);
        
        if (!isDeleted) {
            return;
        }

        const brokers = state.brokers.filter((broker: BrokerEntity) => {
            return broker.id !== state.currentBrokerId;
        });

        setState((currentState) => {
            return {...currentState, brokers, currentBrokerId: null}
        })
    }

    const columns: ColumnDef<BrokerEntity>[] = useMemo(() => [
        {
            header: t("entity_broker_name"),
            render: (broker) => <Text>{broker.name}</Text>
        },
        {
            width: 10,
            render: (broker) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onEditClicked(broker)}
                >
                    <Icon color="card_action_icon_primary">
                        <MdEdit/>
                    </Icon>
                </Button>
            )
        },
        {
            width: 10,
            render: (broker) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onDeleteClicked(broker)}
                >
                    <Icon color="card_action_icon_danger">
                        <MdDelete/>
                    </Icon>
                </Button>
            )
        }
    ], [t, state.brokers]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_brokers")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_add")}
        />
        <DataTable
            data={state.brokers}
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
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("brokers_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
    </Box>
}

export default BrokersTable;