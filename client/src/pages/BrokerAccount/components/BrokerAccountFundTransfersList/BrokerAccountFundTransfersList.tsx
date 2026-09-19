import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useBrokerAccountFundTransfers } from '../../hooks/useBrokerAccountFundTransfers';
import BrokerAccountFundTransfer from '../BrokerAccountFundTransfer/BrokerAccountFundTransfer';
import { BrokerAccountFundTransferEntity } from '../../../../models/brokers/BrokerAccountFundTransfer';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import { useTranslation } from 'react-i18next';
import BrokerAccountFundTransferModal, { CreateBrokerAccountFundTransferContext, EditBrokerAccountFundTransferContext } from '../../../BrokerAccounts/modals/BrokerAccountFundTransferModal/BrokerAccountFundTransferModal';
import { Nullable } from '../../../../shared/utilities/nullable';
import SectionHeader from '../../../../shared/components/SectionHeader';
import { getBrokerAccountFundsTransferPagination } from '../../../../api/brokers/brokerAccountFundsTransferApi';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import CollectionPagination from '../../../../shared/components/CollectionPagination/CollectionPagination';

interface Props {
    brokerAccountId: Nullable<string>,
    onDataChanged?: () => void
}

const BrokerAccountFundTransfersList: React.FC<Props> = (props) => {
    const {
        fundTransfers,
        createFundTransferEntity,
        updateFundTransferEntity,
        deleteFundTransferEntity,
        fundTransfersQueryParameters,
        setFundTransfersQueryParameters
    } = useBrokerAccountFundTransfers({ pageIndex: 1, recordsQuantity: -1, brokerAccountId: props.brokerAccountId });

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
			throw new Error("Deleted entity is not set")
		}

		await deleteFundTransferEntity(activeEntity);
		onActionEnded();
    }

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
			{ brokerAccountId: props.brokerAccountId } as CreateBrokerAccountFundTransferContext;
		setContext(context);
	}, [props.brokerAccountId, activeEntity]);

    useEffect(() => {
        if (props?.onDataChanged){
            props.onDataChanged();
        }
    }, [props.onDataChanged, fundTransfers]);

    const getPagination = useCallback(() => {
        return getBrokerAccountFundsTransferPagination(props.brokerAccountId);
    }, [props.brokerAccountId]);

    const onPageChanged = async (recordsQuantity: number, pageIndex: number) => {
        setFundTransfersQueryParameters({recordsQuantity, pageIndex, brokerAccountId: fundTransfersQueryParameters.brokerAccountId});
    }

    const {t} = useTranslation();

    const isGlobalBrokerAccount = !props.brokerAccountId;

    return <Box>
        <SectionHeader
            title={t("broker_account_page_transfers_tab")}
            size="lg"
            onAdd={onAddClicked}
            addButtonTitle={t("broker_account_page_transfer_button")}
            my={4}
        />
        <Box>
        {
            fundTransfers.map((fundTransfer: BrokerAccountFundTransferEntity) => 
                <BrokerAccountFundTransfer key={fundTransfer.id}
                    isGlobalBrokerAccount={isGlobalBrokerAccount}
                    onEditClicked={onEditClicked}
                    onDeleteClicked={onDeleteClicked}
                    fundTransfer={fundTransfer}
                />)
        }
        </Box>
        <CollectionPagination getPaginationConfig={getPagination} onPageChanged={onPageChanged}/>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("entity_broker_account_fund_transfer_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        {context && <BrokerAccountFundTransferModal isGlobalBrokerAccount={isGlobalBrokerAccount} modalRef={modalRef} context={context} onSaved={onTransferSaved}  />}
    </Box>
}

export default BrokerAccountFundTransfersList;