import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SecurityTransactionEntity, SecurityTransactionEntityRequest } from '../../../../models/securities/SecurityTransactionEntity';
import SecurityTransaction from '../SecurityTransaction/SecurityTransaction';
import SecurityTransactionModal, { CreateSecurityTransactionContext, EditSecurityTransactionContext } from '../../modals/SecurityTransactionModal/SecurityTransactionModal';
import { useSecurityTransactions } from '../../hooks/useSecurityTransactions';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import SectionHeader from '../../../../shared/components/SectionHeader/SectionHeader';
import { Nullable } from '../../../../shared/utilities/nullable';
import CollectionPagination from '../../../../shared/components/CollectionPagination/CollectionPagination';
import { getSecurityTransactionsPagination } from '../../../../api/securities/securityTransactionApi';

interface Props {
	brokerAccountId: Nullable<string>,
	onTransactionsChanged: () => void
}

const SecurityTransactionsList: React.FC<Props> = (props) => {
	const { t } = useTranslation()

	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
		mode,
		onActionEnded
	} = useEntityModal<SecurityTransactionEntity>();

	const {
		securityTransactions,
		createSecurityTransactionEntity,
		updatedSecurityTransactionEntity,
		deleteSecurityTransactionEntity,
		securityTransactionsQueryParameters, 
		setSecurityTransactionsQueryParameters
	} = useSecurityTransactions({pageIndex: 1, recordsQuantity: -1, brokerAccountId: props.brokerAccountId });

	useEffect(() => {
		props.onTransactionsChanged();
	}, [securityTransactions])

	const [context, setContext] = useState<Nullable<CreateSecurityTransactionContext | EditSecurityTransactionContext>>(null);

	const onPageChanged = async (recordsQuantity: number, pageIndex: number) => {
		setSecurityTransactionsQueryParameters({recordsQuantity, pageIndex, brokerAccountId: securityTransactionsQueryParameters.brokerAccountId});
	}

	useEffect(() => {
		const context = activeEntity ?
			{ securityTransaction: activeEntity } as EditSecurityTransactionContext:
			{ brokerAccountId: props.brokerAccountId } as CreateSecurityTransactionContext;
		setContext(context);
	}, [props.brokerAccountId, activeEntity]);

	const onSecurityTransactionSaved = async (securityTransaction: SecurityTransactionEntityRequest) => {
		if (mode === ActiveEntityMode.Add) {
			await createSecurityTransactionEntity(securityTransaction);
		} else if (mode === ActiveEntityMode.Edit) {
			await updatedSecurityTransactionEntity(securityTransaction);
		}
		onActionEnded();
	}

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
			throw new Error("Deleted entity is not set")
		}

		await deleteSecurityTransactionEntity(activeEntity);
		onActionEnded();
	}

	const getPagination = useCallback(() => {
		return getSecurityTransactionsPagination(props.brokerAccountId);
	}, [props.brokerAccountId]);

	const isGlobalBrokerAccount= !props.brokerAccountId;
	
	return <Box>
		<SectionHeader
			title={t("broker_account_page_transactions_tab")}
			size="lg"
			onAdd={onAddClicked}
			addButtonTitle={t("entity_securities_transaction_page_summary_add")}
			my={4}
		/>
		<Box>
		{
			securityTransactions.map((security: SecurityTransactionEntity) => 
				<SecurityTransaction key={security.id} 
					isGlobalBrokerAccount={isGlobalBrokerAccount}
					securityTransaction={security} 
					onEditClicked={onEditClicked} 
					onDeleteClicked={onDeleteClicked}/>)
		}
		</Box>
		<CollectionPagination getPaginationConfig={getPagination} onPageChanged={onPageChanged}/>
		<ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("entity_securities_transaction_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        {context && <SecurityTransactionModal isGlobalBrokerAccount={isGlobalBrokerAccount} context={context} modalRef={modalRef} onSaved={onSecurityTransactionSaved}/>}
	</Box>
}

export default SecurityTransactionsList;