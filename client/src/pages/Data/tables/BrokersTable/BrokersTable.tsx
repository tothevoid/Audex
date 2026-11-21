import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { BrokerEntity } from "@/models/brokers/BrokerEntity";
import { createBroker, deleteBroker, getBrokers, updateBroker } from "@/api/brokers/brokerApi";
import BrokerModal from "@/pages/Data/modals/BrokerModal/BrokerModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";

const BrokersTable: React.FC = () => {
    const [brokers, setBrokers] = useState<BrokerEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatedBroker, setUpdatedBroker] = useState<BrokerEntity | null>(null);
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const modalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        const initData = async () => { 
            setIsLoading(true);
            try {
                const fetchedBrokers = await getBrokers();
                setBrokers(fetchedBrokers);
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, []);

    useEffect(() => {
        if (updatedBroker) {
            modalRef.current?.openModal();
        }
    }, [updatedBroker]);
    
    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onEditClicked = (broker: BrokerEntity) => {
        setUpdatedBroker(broker);
    };

    const onModalClosed = () => {
        setUpdatedBroker(null);
    };

    const onBrokerSaved = async (savedBroker: BrokerEntity) => {
        const isModified = brokers.some((brokerItem: BrokerEntity) => brokerItem.id === savedBroker.id);

        if (isModified) {
            await updateBroker(savedBroker);
            notify.success(t("broker_toast_updated_title"), t("broker_toast_updated_desc", { name: savedBroker.name }));
            setBrokers((currentBrokers) => currentBrokers.map((brokerItem: BrokerEntity) => brokerItem.id === savedBroker.id ? savedBroker : brokerItem));
        } else {
            const createdBroker = await createBroker(savedBroker);
            if (!createdBroker) {
                return;
            }
            notify.success(t("broker_toast_created_title"), t("broker_toast_created_desc", { name: createdBroker.name }));
            setBrokers((currentBrokers) => [...currentBrokers, createdBroker]);
        }
    };

    const onDeleteClicked = async (broker: BrokerEntity) => {
        const confirmed = await confirmDelete(t("brokers_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteBroker(broker.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("broker_toast_deleted_title"), t("broker_toast_deleted_desc", { name: broker.name }));

        setBrokers((currentBrokers) => currentBrokers.filter((brokerItem: BrokerEntity) => brokerItem.id !== broker.id));
    };

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
    ], [t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_brokers")}
            onAdd={onAdd}
            addButtonTitle={t("entity_broker_add")}
        />
        <DataTable
            data={brokers}
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