import React, { useEffect, useRef } from 'react';
import Account from '../Account/Account';
import { Box, Checkbox, SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { BaseModalRef } from '../../../../shared/utilities/modalUtilities';
import AccountModal from '../../modals/AccountModal/AccountModal';
import { useAccounts } from '../../hooks/useAccounts';
import Placeholder from '../../../../shared/components/Placeholder/Placeholder';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import SectionHeader from '../../../../shared/components/SectionHeader/SectionHeader';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import AccountBalanceTransferModal from '../../modals/AccountBalanceTransferModal/AccountBalanceTransferModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';

interface Props {
	onAccountsChanged: () => void
}

const AccountsList: React.FC<Props> = ({onAccountsChanged}) => {
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

	const onCheckboxChanged = async (checkboxChange: any) => {	
		setAccountQueryParameters({onlyActive: !!checkboxChange.checked})
	}

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
		<SectionHeader
			title={t("header_accounts")}
			onAdd={onAddClicked}
			addButtonTitle={t("accounts_page_summary_add")}
			pb={4}
			rightElement={
				<Checkbox.Root checked={accountQueryParameters.onlyActive} onCheckedChange={onCheckboxChanged} variant="solid">
					<Checkbox.HiddenInput />
					<Checkbox.Control />
					<Checkbox.Label color="text_primary">{t("accounts_list_only_active")}</Checkbox.Label>
				</Checkbox.Root>
			}
		/>
		{
			accounts.length > 0 ?
				<SimpleGrid pt={5} pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(350px, 3fr))'>
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