import React, { useEffect, useRef } from 'react';
import Account from '@/pages/Accounts/components/Account/Account';
import { Box } from '@chakra-ui/react';
import CardsGrid from '@/shared/components/CardsGrid';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import AccountModal from '@/pages/Accounts/modals/AccountModal/AccountModal';
import { useAccounts } from '@/pages/Accounts/hooks/useAccounts';
import Placeholder from '@/shared/components/Placeholder/Placeholder';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
import AddButton from '@/shared/components/AddButton/AddButton';
import AccountsHeader from '@/pages/Accounts/components/AccountsHeader/AccountsHeader';
import { AccountCurrencySummary } from '@/models/accounts/accountsSummary';
import AccountBalanceTransferModal from '@/pages/Accounts/modals/AccountBalanceTransferModal/AccountBalanceTransferModal';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';

interface Props {
	onAccountsChanged: () => void;
	accountCurrencySummaries: AccountCurrencySummary[];
}

const AccountsList: React.FC<Props> = ({ onAccountsChanged, accountCurrencySummaries }) => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const transferModalRef = useRef<BaseModalRef>(null);
	
	const { 
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		mode,
		onActionEnded,
		setActiveEntity
	} = useEntityModal<AccountEntity>();

	const { 
		accounts, 
		accountQueryParameters,
		createAccountEntity,
		updateAccountEntity,
		deleteAccountEntity,
		setAccountQueryParameters,
		reloadAccounts
	} = useAccounts({ onlyActive: true });

	useEffect(() => {
		onAccountsChanged();
	}, [accounts, onAccountsChanged]);

	const onOnlyActiveChange = (active: boolean) => {	
		setAccountQueryParameters(prev => ({ ...prev, onlyActive: active }));
	};

	const onCurrencyChange = (currencyId: string | null) => {
		setAccountQueryParameters(prev => ({ ...prev, currencyId }));
	};

	const onAccountTypeChange = (accountTypeId: string | null) => {
		setAccountQueryParameters(prev => ({ ...prev, accountTypeId }));
	};

	const getAddButton = () => {
		return <AddButton buttonTitle={t("accounts_page_summary_add")} onClick={onAddClicked}/>;
	};

  	const onAccountSaved = async (account: AccountEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createAccountEntity(account);
		} else {
			await updateAccountEntity(account);
		}

		onActionEnded();
	};

	const onDeleteClicked = async (account: AccountEntity) => {
		const confirmed = await confirmDelete(t("account_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteAccountEntity(account);
	};

	const onTransferClicked = (account: AccountEntity) => {
		setActiveEntity(account);
		transferModalRef.current?.openModal();
	};
	
	const onTransferred = () => {
		reloadAccounts();
		onActionEnded();
	};

	return <Box>
		<AccountsHeader
			accountCurrencySummaries={accountCurrencySummaries}
			onAddClicked={onAddClicked}
			onlyActive={accountQueryParameters.onlyActive}
			onOnlyActiveChange={onOnlyActiveChange}
			selectedCurrencyId={accountQueryParameters.currencyId}
			onCurrencyChange={onCurrencyChange}
			selectedAccountTypeId={accountQueryParameters.accountTypeId}
			onAccountTypeChange={onAccountTypeChange}
		/>
		{
			accounts.length > 0 ?
				<CardsGrid>
				{
					accounts.map((account: AccountEntity) => {
						return <Account key={account.id} account={account} 
							onEditClicked={onEditClicked}
							onDeleteClicked={onDeleteClicked}
							onTransferClicked={onTransferClicked}/>;
					})
				}
				</CardsGrid>:
				<Placeholder text={t("accounts_list_no_accounts")}>
					{getAddButton()}
				</Placeholder>
		}
        <AccountBalanceTransferModal from={activeEntity} modalRef={transferModalRef} onTransferred={onTransferred}/>
        <AccountModal account={activeEntity} modalRef={modalRef} onSaved={onAccountSaved}/>
	</Box>;
};

export default AccountsList;