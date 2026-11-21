import React, { useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SecurityTransactionEntity, SecurityTransactionEntityRequest } from '@/models/securities/SecurityTransactionEntity';
import SecurityTransaction from '@/pages/BrokerAccount/components/SecurityTransaction/SecurityTransaction';
import SecurityTransactionModal, { CreateSecurityTransactionContext, EditSecurityTransactionContext } from '@/pages/BrokerAccount/modals/SecurityTransactionModal/SecurityTransactionModal';
import { useSecurityTransactions } from '@/pages/BrokerAccount/hooks/useSecurityTransactions';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import SectionHeader from '@/shared/components/SectionHeader/SectionHeader';
import { Nullable } from '@/shared/utilities/nullable';
import CollectionPagination from '@/shared/components/CollectionPagination/CollectionPagination';
import SecurityTransactionsFilter from '@/pages/BrokerAccount/components/SecurityTransactionsFilter/SecurityTransactionsFilter';
import {
	SecurityTransactionsFilterValues,
	createDefaultSecurityTransactionsFilter
} from '@/models/securities/SecurityTransactionsRequest';
import PlaceholderWrapper from '@/shared/components/Placeholder/PlaceholderWrapper';
import AddButton from '@/shared/components/AddButton/AddButton';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';
import LoadingList from '@/shared/components/LoadingList/LoadingList';
import DateGroupedList from '@/shared/components/DateGroupedList/DateGroupedList';

interface Props {
	brokerAccountId: Nullable<string>;
	onTransactionsChanged: () => void;
}

const SecurityTransactionsList: React.FC<Props> = ({ brokerAccountId, onTransactionsChanged }) => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		mode,
		onActionEnded
	} = useEntityModal<SecurityTransactionEntity>();

	const isGlobalBrokerAccount = !brokerAccountId;

	const {
		securityTransactions,
		totalCount,
		isSecurityTransactionsLoading,
		createSecurityTransactionEntity,
		updatedSecurityTransactionEntity,
		deleteSecurityTransactionEntity,
		queryParameters,
		setQueryParameters
	} = useSecurityTransactions(brokerAccountId);

	const showSkeleton = useDelayedLoading(isSecurityTransactionsLoading);

	const onFilterChange = (newFilters: SecurityTransactionsFilterValues) => {
		setQueryParameters(previousQueryParameters => ({
			...previousQueryParameters,
			pageIndex: 1,
			...newFilters,
			brokerAccountId: brokerAccountId ?? newFilters.brokerAccountId
		}));
	};

	const onResetFilters = () => {
		onFilterChange(createDefaultSecurityTransactionsFilter(brokerAccountId));
	};

	const onPageChanged = (pageNumber: number, pageSize: number) => {
		setQueryParameters(previousQueryParameters => ({
			...previousQueryParameters,
			recordsQuantity: pageSize,
			pageIndex: pageNumber <= 0 ? 1 : pageNumber
		}));
	};

	const context = useMemo<CreateSecurityTransactionContext | EditSecurityTransactionContext>(() => {
		if (activeEntity) {
			return { securityTransaction: activeEntity };
		}
		return { brokerAccountId };
	}, [brokerAccountId, activeEntity]);

	const onSecurityTransactionSaved = async (securityTransaction: SecurityTransactionEntityRequest, securityName?: string) => {
		if (mode === ActiveEntityMode.Add) {
			await createSecurityTransactionEntity(securityTransaction, securityName);
		} else if (mode === ActiveEntityMode.Edit) {
			await updatedSecurityTransactionEntity(securityTransaction, securityName);
		}
		onActionEnded();
		onTransactionsChanged();
	};

	const onDeleteClicked = useCallback(async (transaction: SecurityTransactionEntity) => {
		const confirmed = await confirmDelete(t("entity_securities_transaction_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteSecurityTransactionEntity(transaction);
		onTransactionsChanged();
	}, [confirmDelete, deleteSecurityTransactionEntity, onTransactionsChanged, t]);

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
				filters={queryParameters}
				onFilterChange={onFilterChange}
				onReset={onResetFilters}
			/>

			<LoadingList isLoading={showSkeleton} count={3} height="72px">
				<PlaceholderWrapper
					hasData={securityTransactions.length > 0}
					text={t("security_transactions_empty")}
					action={<AddButton buttonTitle={t("entity_securities_transaction_page_summary_add")} onClick={onAddClicked} />}
				>
					<DateGroupedList<SecurityTransactionEntity>
						items={securityTransactions}
						dateSelector={(transaction) => transaction.date}
						keySelector={(transaction) => transaction.id}
						renderItem={(transaction) => (
							<SecurityTransaction
								key={transaction.id}
								isGlobalBrokerAccount={isGlobalBrokerAccount}
								securityTransaction={transaction}
								onEditClicked={onEditClicked}
								onDeleteClicked={onDeleteClicked}
							/>
						)}
					/>
				</PlaceholderWrapper>
			</LoadingList>

			<CollectionPagination
				count={totalCount}
				page={queryParameters.pageIndex}
				pageSize={queryParameters.recordsQuantity}
				onPageChange={onPageChanged}
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