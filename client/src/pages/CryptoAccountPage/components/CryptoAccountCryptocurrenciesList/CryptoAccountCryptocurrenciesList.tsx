import React, { Fragment, useMemo } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { useCryptoAccountCryptocurrencies } from '../../hooks/useCryptoAccountCryptocurrencies';
import { CryptoAccountEntity } from '../../../../models/crypto/CryptoAccountEntity';
import { CryptoAccountCryptocurrencyEntity } from '../../../../models/crypto/CryptoAccountCryptocurrencyEntity';
import CryptoAccountCryptocurrency from '../CryptoAccountCryptocurrency/CryptoAccountCryptocurrency';
import CryptoAccountCryptocurrencyModal from '../../modals/CryptoAccountCryptocurrencyModal';
import CryptoAccountHeader from '../CryptoAccountHeader/CryptoAccountHeader';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import { useTranslation } from 'react-i18next';

import Placeholder from '../../../../shared/components/Placeholder/Placeholder';

interface Props {
	cryptoAccount: CryptoAccountEntity;
	onDataChanged: () => void;
}

const CryptoAccountCryptocurrenciesList: React.FC<Props> = (props: Props) => {
	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
		mode,
		handleDelete,
		executeWithCleanup
	} = useEntityModal<CryptoAccountCryptocurrencyEntity>();
	
	const { 
		cryptoAccountCryptocurrencies,
		totalBalanceUsd,
		addCryptoAccountCryptocurrencyEntity,
		updateCryptoAccountCryptocurrencyEntity,
		deleteCryptoAccountCryptocurrencyEntity,
		reloadCryptoAccountCryptocurrencies
	} = useCryptoAccountCryptocurrencies({cryptoAccountId: props.cryptoAccount.id});

	const existingCryptocurrencyIds = useMemo(
		() => cryptoAccountCryptocurrencies.map(c => c.cryptocurrency?.id).filter(Boolean),
		[cryptoAccountCryptocurrencies]
	);

	const onCryptocurrencyCryptoaccountSaved = executeWithCleanup(async (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await addCryptoAccountCryptocurrencyEntity(cryptoAccountCryptocurrency);
		} else if (mode === ActiveEntityMode.Edit) {
			await updateCryptoAccountCryptocurrencyEntity(cryptoAccountCryptocurrency);
		}
		props.onDataChanged();
	});

	const { t } = useTranslation();

	const onDeleteConfirmed = handleDelete(async (cryptoAccountCryptocurrency) => {
		await deleteCryptoAccountCryptocurrencyEntity(cryptoAccountCryptocurrency.id);
		props.onDataChanged();
	});

	return (
		<Fragment>
			<CryptoAccountHeader
				cryptoAccount={props.cryptoAccount}
				totalBalanceUsd={totalBalanceUsd}
				onAddClicked={onAddClicked}
			/>

			{cryptoAccountCryptocurrencies.length > 0 ? (
				<SimpleGrid pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(350px, 3fr))'>
					{cryptoAccountCryptocurrencies.map((cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => (
						<CryptoAccountCryptocurrency
							onReloadCryptoAccountCryptocurrencies={reloadCryptoAccountCryptocurrencies}
							cryptoAccountCryptocurrency={cryptoAccountCryptocurrency}
							key={cryptoAccountCryptocurrency.id}
							onEditClicked={onEditClicked}
							onDeleteClicked={onDeleteClicked}
						/>
					))}
				</SimpleGrid>
			) : (
				<Placeholder text={t("crypto_account_page_no_cryptocurrencies")}>
					<AddButton onClick={onAddClicked} buttonTitle={t('add_crypto_account_cryptocurrency_title')}/>
				</Placeholder>
			)}

			<CryptoAccountCryptocurrencyModal
				modalRef={modalRef}
				cryptoAccountCryptocurrency={activeEntity}
				cryptoAccount={props.cryptoAccount}
				existingCryptocurrencyIds={existingCryptocurrencyIds}
				onSaved={onCryptocurrencyCryptoaccountSaved}
			/>
			<ConfirmModal onConfirmed={onDeleteConfirmed}
				title={t("crypto_account_cryptocurrency_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}/>
		</Fragment>
	);
};

export default CryptoAccountCryptocurrenciesList;