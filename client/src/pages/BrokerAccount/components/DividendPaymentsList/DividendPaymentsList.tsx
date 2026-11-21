import React, { useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useDividendPayments } from '@/pages/BrokerAccount/hooks/useDividendPayments';
import { DividendPaymentEntity } from '@/models/brokers/DividendPaymentEntity';
import DividendPayment from '@/pages/BrokerAccount/components/DividendPayment/DividendPayment';
import DividendPaymentModal, { CreateDividendPaymentContext, EditDividendPaymentContext } from '@/pages/BrokerAccount/modals/DividendPaymentModal/DividendPaymentModal';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
import SectionHeader from '@/shared/components/SectionHeader/SectionHeader';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import { Nullable } from '@/shared/utilities/nullable';
import CollectionPagination from '@/shared/components/CollectionPagination/CollectionPagination';
import DateGroupedList from '@/shared/components/DateGroupedList/DateGroupedList';

interface Props {
	brokerAccountId: Nullable<string>,
	onDividendsChanged: () => void
}

const DividendPaymentsList: React.FC<Props> = (props) => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		mode,
		onActionEnded
	} = useEntityModal<DividendPaymentEntity>();

	const {
		dividendPayments,
		totalCount,
		pageIndex,
		pageSize,
		loadPage,
		createDividendPaymentEntity,
		updateDividendPaymentEntity,
		deleteDividendPaymentEntity
	} = useDividendPayments({
		brokerAccountId: props.brokerAccountId,
		onDataChanged: props.onDividendsChanged
	});

	const context: Nullable<CreateDividendPaymentContext | EditDividendPaymentContext> = useMemo(() => {
		if (!props.brokerAccountId && !activeEntity) {
			return null;
		}
		return activeEntity
			? ({ dividendPayment: activeEntity } as EditDividendPaymentContext)
			: ({ brokerAccountId: props.brokerAccountId } as CreateDividendPaymentContext);
	}, [props.brokerAccountId, activeEntity]);

	const dividendPaymentSaved = (dividendPayment: DividendPaymentEntity) => {
		if (mode === ActiveEntityMode.Add) {
			createDividendPaymentEntity(dividendPayment);
		} else {
			updateDividendPaymentEntity(dividendPayment);
		}
		onActionEnded();
	};

	const onDeleteClicked = useCallback(async (payment: DividendPaymentEntity) => {
		const confirmed = await confirmDelete(t("entity_securities_transaction_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteDividendPaymentEntity(payment);
	}, [confirmDelete, deleteDividendPaymentEntity, t]);

	const isGlobalBrokerAccount = !props.brokerAccountId;

	return (
		<Box>
			<SectionHeader
				title={t("broker_account_page_dividends_tab")}
				size="lg"
				onAdd={onAddClicked}
				addButtonTitle={t("broker_account_page_add_dividend_payment_button")}
				my={4}
			/>
			<DateGroupedList<DividendPaymentEntity>
				items={dividendPayments}
				dateSelector={(payment) => payment.receivedAt}
				keySelector={(payment) => payment.id}
				renderItem={(payment) => (
					<DividendPayment
						key={payment.id}
						isGlobalBrokerAccount={isGlobalBrokerAccount}
						dividendPayment={payment}
						onEditClicked={onEditClicked}
						onDeleteClicked={onDeleteClicked}
					/>
				)}
			/>
			<CollectionPagination
				count={totalCount}
				page={pageIndex}
				pageSize={pageSize}
				onPageChange={loadPage}
			/>
			{context && <DividendPaymentModal isGlobalBrokerAccount={isGlobalBrokerAccount} context={context} modalRef={modalRef} onSaved={dividendPaymentSaved} />}
		</Box>
	);
};

export default DividendPaymentsList;