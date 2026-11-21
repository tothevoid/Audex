import React, { useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useBrokerAccountFundTransfers } from '@/pages/BrokerAccount/hooks/useBrokerAccountFundTransfers';
import BrokerAccountFundTransfer from '@/pages/BrokerAccount/components/BrokerAccountFundTransfer/BrokerAccountFundTransfer';
import { BrokerAccountFundTransferEntity } from '@/models/brokers/BrokerAccountFundTransfer';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
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
    const { confirmDelete } = useConfirm();

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
        onAddClicked,
        onEditClicked,
        onActionEnded,
        mode,
    } = useEntityModal<BrokerAccountFundTransferEntity>();

    const onDeleteClicked = useCallback(async (transfer: BrokerAccountFundTransferEntity) => {
        const confirmed = await confirmDelete(t("entity_broker_account_fund_transfer_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteFundTransferEntity(transfer);
        onDataChanged();
    }, [confirmDelete, deleteFundTransferEntity, onDataChanged, t]);

    const onTransferSaved = async (transfer: BrokerAccountFundTransferEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createFundTransferEntity(transfer);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateFundTransferEntity(transfer);
        }

        onActionEnded();
        onDataChanged();
    };

    const context = useMemo<CreateBrokerAccountFundTransferContext | EditBrokerAccountFundTransferContext>(() => {
        if (activeEntity) {
            return { brokerAccountFundTransfer: activeEntity };
        }
        return { brokerAccountId };
    }, [activeEntity, brokerAccountId]);

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
            {context && <BrokerAccountFundTransferModal isGlobalBrokerAccount={isGlobalBrokerAccount} modalRef={modalRef} context={context} onSaved={onTransferSaved} />}
        </Box>
    );
};

export default BrokerAccountFundTransfersList;