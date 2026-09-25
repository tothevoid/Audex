import React, { useEffect, useState } from 'react';
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
import SecurityTransactionsFilter from '../SecurityTransactionsFilter/SecurityTransactionsFilter';
import {
	SecurityTransactionsFilterValues,
	createDefaultSecurityTransactionsFilter
} from '../../../../models/securities/SecurityTransactionsRequest';
import PlaceholderWrapper from '../../../../shared/components/Placeholder/PlaceholderWrapper';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import { useDelayedLoading } from '../../../../shared/hooks/useDelayedLoading';
import LoadingList from '../../../../shared/components/LoadingList/LoadingList';

interface Props {
	brokerAccountId: Nullable<string>;
	onTransactionsChanged: () => void;
}

const SecurityTransactionsList: React.FC<Props> = (props) => {
	const { t } = useTranslation();

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

	const isGlobalBrokerAccount = !props.brokerAccountId;

	const {
		securityTransactions,
		totalCount,
		isSecurityTransactionsLoading,
		createSecurityTransactionEntity,
		updatedSecurityTransactionEntity,
		deleteSecurityTransactionEntity,
		securityTransactionsQueryParameters,
		setSecurityTransactionsQueryParameters
	} = useSecurityTransactions(props.brokerAccountId);

	const showSkeleton = useDelayedLoading(isSecurityTransactionsLoading);

	useEffect(() => {
		props.onTransactionsChanged();
	}, [securityTransactions]);

	const [context, setContext] = useState<Nullable<CreateSecurityTransactionContext | EditSecurityTransactionContext>>(null);

	const onFilterChange = (newFilters: SecurityTransactionsFilterValues) => {
		setSecurityTransactionsQueryParameters(previousQueryParameters => ({
			...previousQueryParameters,
			pageIndex: 1,
			...newFilters,
			brokerAccountId: props.brokerAccountId ?? newFilters.brokerAccountId
		}));
	};

	const onResetFilters = () => {
		onFilterChange(createDefaultSecurityTransactionsFilter(props.brokerAccountId));
	};

	const onPageChanged = (pageNumber: number, pageSize: number) => {
		setSecurityTransactionsQueryParameters(previousQueryParameters => ({
			...previousQueryParameters,
			recordsQuantity: pageSize,
			pageIndex: pageNumber <= 0 ? 1 : pageNumber
		}));
	};

	useEffect(() => {
		const context = activeEntity ?
			{ securityTransaction: activeEntity } as EditSecurityTransactionContext :
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
	};

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
			throw new Error("Deleted entity is not set");
		}

		await deleteSecurityTransactionEntity(activeEntity);
		onActionEnded();
	};

	return (
		<Box>
			<SectionHeader
				title={t("broker_account_page_transactions_tab")}
				size="lg"
				onAdd={onAddClicked}
				addButtonTitle={t("entity_securities_transaction_page_summary_add")}
				my={4}
			/>

			<SecurityTransactionsFilter
				isGlobalBrokerAccount={isGlobalBrokerAccount}
				filters={securityTransactionsQueryParameters}
				onFilterChange={onFilterChange}
				onReset={onResetFilters}
			/>

			<LoadingList isLoading={showSkeleton} count={3} height="72px">
				<PlaceholderWrapper
					hasData={securityTransactions.length > 0}
					text={t("security_transactions_empty")}
					action={<AddButton buttonTitle={t("entity_securities_transaction_page_summary_add")} onClick={onAddClicked} />}
				>
					<Box>
						{securityTransactions.map((security: SecurityTransactionEntity) => (
							<SecurityTransaction
								key={security.id}
								isGlobalBrokerAccount={isGlobalBrokerAccount}
								securityTransaction={security}
								onEditClicked={onEditClicked}
								onDeleteClicked={onDeleteClicked}
							/>
						))}
					</Box>
				</PlaceholderWrapper>
			</LoadingList>

			<CollectionPagination
				count={totalCount}
				page={securityTransactionsQueryParameters.pageIndex}
				pageSize={securityTransactionsQueryParameters.recordsQuantity}
				onPageChange={onPageChanged}
			/>

			<ConfirmModal
				onConfirmed={onDeleteConfirmed}
				title={t("entity_securities_transaction_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}
			/>

			{context && (
				<SecurityTransactionModal
					isGlobalBrokerAccount={isGlobalBrokerAccount}
					context={context}
					modalRef={modalRef}
					onSaved={onSecurityTransactionSaved}
				/>
			)}
		</Box>
	);
};

export default SecurityTransactionsList;