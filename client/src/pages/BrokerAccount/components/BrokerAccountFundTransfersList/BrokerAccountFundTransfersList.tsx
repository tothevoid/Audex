import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useBrokerAccountFundTransfers } from '@/pages/BrokerAccount/hooks/useBrokerAccountFundTransfers';
import BrokerAccountFundTransfer from '@/pages/BrokerAccount/components/BrokerAccountFundTransfer/BrokerAccountFundTransfer';
import { BrokerAccountFundTransferEntity } from '@/models/brokers/BrokerAccountFundTransfer';
import { ConfirmModal } from '@/shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useTranslation } from 'react-i18next';
import BrokerAccountFundTransferModal, { CreateBrokerAccountFundTransferContext, EditBrokerAccountFundTransferContext } from '@/pages/BrokerAccounts/modals/BrokerAccountFundTransferModal/BrokerAccountFundTransferModal';
import { Nullable } from '@/shared/utilities/nullable';
import SectionHeader from '@/shared/components/SectionHeader';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import CollectionPagination from '@/shared/components/CollectionPagination/CollectionPagination';
import DateGroupedList from '@/shared/components/DateGroupedList/DateGroupedList';

interface Props {
    brokerAccountId: Nullable<string>,
    onDataChanged: () => void
}

const BrokerAccountFundTransfersList: React.FC<Props> = ({ brokerAccountId, onDataChanged }) => {
    const { t } = useTranslation();

    const {
        fundTransfers,
        totalCount,
        pageIndex,
        pageSize,
        loadPage,
        createFundTransferEntity,
        updateFundTransferEntity,
        deleteFundTransferEntity
    } = useBrokerAccountFundTransfers({ brokerAccountId });

    const { 
        modalRef,
        activeEntity,
        confirmModalRef,
        onDeleteClicked,
        onAddClicked,
        onEditClicked,
        onActionEnded,
        mode,
    } = useEntityModal<BrokerAccountFundTransferEntity>();

    const onDeleteConfirmed = async () => {
       	if (!activeEntity) {
			throw new Error("Deleted entity is not set");
		}

		await deleteFundTransferEntity(activeEntity);
		onActionEnded();
    };

    const [context, setContext] = useState<Nullable<CreateBrokerAccountFundTransferContext | EditBrokerAccountFundTransferContext>>(null);

    const onTransferSaved = async (transfer: BrokerAccountFundTransferEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createFundTransferEntity(transfer);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateFundTransferEntity(transfer);
        }

        onActionEnded();
    };

	useEffect(() => {
		const context = activeEntity ?
			{ brokerAccountFundTransfer: activeEntity } as EditBrokerAccountFundTransferContext:
			{ brokerAccountId } as CreateBrokerAccountFundTransferContext;
		setContext(context);
	}, [brokerAccountId, activeEntity]);

    useEffect(() => {
        onDataChanged();
    }, [onDataChanged, fundTransfers]);

    const isGlobalBrokerAccount = !brokerAccountId;

    return (
        <Box>
            <SectionHeader
                title={t("broker_account_page_transfers_tab")}
                size="lg"
                onAdd={onAddClicked}
                addButtonTitle={t("broker_account_page_transfer_button")}
                my={4}
            />
            <DateGroupedList<BrokerAccountFundTransferEntity>
                items={fundTransfers}
                dateSelector={(transfer) => transfer.date}
                keySelector={(transfer) => transfer.id}
                renderItem={(transfer) => (
                    <BrokerAccountFundTransfer
                        key={transfer.id}
                        isGlobalBrokerAccount={isGlobalBrokerAccount}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                        fundTransfer={transfer}
                    />
                )}
            />
            <CollectionPagination
                count={totalCount}
                page={pageIndex}
                pageSize={pageSize}
                onPageChange={loadPage}
            />
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("entity_broker_account_fund_transfer_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        {context && <BrokerAccountFundTransferModal isGlobalBrokerAccount={isGlobalBrokerAccount} modalRef={modalRef} context={context} onSaved={onTransferSaved}  />}
    </Box>
    );
};

export default BrokerAccountFundTransfersList;