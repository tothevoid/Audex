import React, { useEffect, useRef } from 'react';
import Account from '../Account/Account';
import { Box, SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { BaseModalRef } from '../../../../shared/utilities/modalUtilities';
import AccountModal from '../../modals/AccountModal/AccountModal';
import { useAccounts } from '../../hooks/useAccounts';
import Placeholder from '../../../../shared/components/Placeholder/Placeholder';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import AccountsHeader from '../AccountsHeader/AccountsHeader';
import { AccountCurrencySummary } from '../../../../models/accounts/accountsSummary';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import AccountBalanceTransferModal from '../../modals/AccountBalanceTransferModal/AccountBalanceTransferModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';

interface Props {
	onAccountsChanged: () => void;
	accountCurrencySummaries: AccountCurrencySummary[];
}

const AccountsList: React.FC<Props> = ({ onAccountsChanged, accountCurrencySummaries }) => {
	const { t } = useTranslation();

	const transferModalRef = useRef<BaseModalRef>(null);
	
	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
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
	} = useAccounts({ onlyActive: true })

	useEffect(() => {
		onAccountsChanged();
	}, [accounts, onAccountsChanged])

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
		return <AddButton buttonTitle={t("accounts_page_summary_add")} onClick={onAddClicked}/>
	}

  	const onAccountSaved = async (account: AccountEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createAccountEntity(account);
		} else {
			await updateAccountEntity(account)
		}

		onActionEnded();
	}

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
            throw new Error("Deleted entity is not set")
        }

        await deleteAccountEntity(activeEntity);
		onActionEnded();
    }

	const onTransferClicked = (account: AccountEntity) => {
		setActiveEntity(account);
		transferModalRef.current?.openModal()
	}
	
	const onTransferred = () => {
		reloadAccounts();
		onActionEnded();
	}

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
				<SimpleGrid pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(350px, 3fr))'>
				{
					accounts.map((account: AccountEntity) => {
						return <Account key={account.id} account={account} 
							onEditClicked={onEditClicked}
							onDeleteClicked={onDeleteClicked}
							onTransferClicked={onTransferClicked}/>
					})
				}
				</SimpleGrid>:
				<Placeholder text={t("accounts_list_no_accounts")}>
					{getAddButton()}
				</Placeholder>
		}
		<ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("account_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        <AccountBalanceTransferModal from={activeEntity} modalRef={transferModalRef} onTransferred={onTransferred}/>
        <AccountModal account={activeEntity} modalRef={modalRef} onSaved={onAccountSaved}/>
	</Box>
}

export default AccountsList;