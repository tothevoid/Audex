import React, { Fragment, useCallback } from 'react';
import CardsGrid from '@/shared/components/CardsGrid';
import { useTranslation } from 'react-i18next';
import BrokerAccount from '@/pages/BrokerAccounts/components/BrokerAccount/BrokerAccount';
import { BrokerAccountEntity } from '@/models/brokers/BrokerAccountEntity';
import BrokerAccountModal from '@/pages/BrokerAccounts/modals/BrokerAccountModal/BrokerAccountModal';
import { useBrokerAccounts } from '@/pages/BrokerAccounts/hooks/useBrokerAccounts';
import Placeholder from '@/shared/components/Placeholder/Placeholder';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import AddButton from '@/shared/components/AddButton/AddButton';
import SectionHeader from '@/shared/components/SectionHeader/SectionHeader';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';

const BrokerAccountsList: React.FC = () => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		mode,
		onActionEnded
	} = useEntityModal<BrokerAccountEntity>();

	const {
		brokerAccounts,
		createBrokerAccountEntity,
		updateBrokerAccountEntity,
		deleteBrokerAccountEntity,
	} = useBrokerAccounts();

	const onBrokerAccountSaved = async (brokerAccount: BrokerAccountEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createBrokerAccountEntity(brokerAccount);
		} else if (mode === ActiveEntityMode.Edit) {
			await updateBrokerAccountEntity(brokerAccount);
		}
		onActionEnded();
	};

	const onDeleteClicked = useCallback(async (brokerAccount: BrokerAccountEntity) => {
		const confirmed = await confirmDelete(t("broker_account_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteBrokerAccountEntity(brokerAccount);
	}, [confirmDelete, deleteBrokerAccountEntity, t]);

	const getHeader = () => {
		const placeholderAddButton = (
			<AddButton
				buttonTitle={t("broker_accounts_page_summary_add")}
				onClick={onAddClicked}
			/>
		);

		return brokerAccounts.length ? (
			<SectionHeader
				title={t("header_broker_account")}
				onAdd={onAddClicked}
				addButtonTitle={t("broker_accounts_page_summary_add")}
			/>
		) : (
			<Placeholder text={t("broker_accounts_page_no_accounts")}>
				{placeholderAddButton}
			</Placeholder>
		);
	};

	return (
		<Fragment>
			{getHeader()}
			<CardsGrid>
				{
					brokerAccounts.map((brokerAccount: BrokerAccountEntity) =>
						<BrokerAccount brokerAccount={brokerAccount}
							onEditClick={onEditClicked}
							onDeleteClick={onDeleteClicked}
							key={brokerAccount.id} />)
				}
			</CardsGrid>
			<BrokerAccountModal brokerAccount={activeEntity} modalRef={modalRef} onSaved={onBrokerAccountSaved} />
		</Fragment>
	);
};

export default BrokerAccountsList;