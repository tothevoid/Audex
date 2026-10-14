import React, { Fragment, useMemo } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { useCryptoAssets } from '@/pages/CryptoAccountPage/hooks/useCryptoAssets';
import { CryptoAccountEntity } from '@/models/crypto/CryptoAccountEntity';
import { CryptoAssetEntity } from '@/models/crypto/CryptoAssetEntity';
import CryptoAsset from '@/pages/CryptoAccountPage/components/CryptoAsset/CryptoAsset';
import CryptoAssetModal from '@/pages/CryptoAccountPage/modals/CryptoAssetModal';
import CryptoAccountHeader from '@/pages/CryptoAccountPage/components/CryptoAccountHeader/CryptoAccountHeader';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { ConfirmModal } from '@/shared/modals/ConfirmModal/ConfirmModal';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import AddButton from '@/shared/components/AddButton/AddButton';
import { useTranslation } from 'react-i18next';
import Placeholder from '@/shared/components/Placeholder/Placeholder';

interface Props {
	cryptoAccount: CryptoAccountEntity;
	onDataChanged: () => void;
}

const CryptoAssetsList: React.FC<Props> = ({ cryptoAccount, onDataChanged }: Props) => {
	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
		mode,
		onActionEnded,
	} = useEntityModal<CryptoAssetEntity>();
	
	const { 
		cryptoAssets,
		totalBalanceUsd,
		addCryptoAssetEntity,
		updateCryptoAssetEntity,
		deleteCryptoAssetEntity
	} = useCryptoAssets(cryptoAccount.id);

	const existingCryptocurrencyIds = useMemo(
		() => cryptoAssets.map(asset => asset.cryptocurrency?.id).filter(Boolean),
		[cryptoAssets]
	);

	const onCryptoAssetSaved = async (cryptoAsset: CryptoAssetEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await addCryptoAssetEntity(cryptoAsset);
		} else if (mode === ActiveEntityMode.Edit) {
			await updateCryptoAssetEntity(cryptoAsset);
		}
		onDataChanged();
		onActionEnded();
	};

	const { t } = useTranslation();

	const onDeleteConfirmed = async () => {
		if (!activeEntity) return;
		await deleteCryptoAssetEntity(activeEntity);
		onDataChanged();
		onActionEnded();
	};

	return (
		<Fragment>
			<CryptoAccountHeader
				cryptoAccount={cryptoAccount}
				totalBalanceUsd={totalBalanceUsd}
				onAddClicked={onAddClicked}
			/>

			{cryptoAssets.length > 0 ? (
				<SimpleGrid pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(350px, 3fr))'>
					{cryptoAssets.map((cryptoAsset: CryptoAssetEntity) => (
						<CryptoAsset
							cryptoAsset={cryptoAsset}
							key={cryptoAsset.id}
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

			<CryptoAssetModal
				modalRef={modalRef}
				cryptoAsset={activeEntity}
				cryptoAccount={cryptoAccount}
				existingCryptocurrencyIds={existingCryptocurrencyIds}
				onSaved={onCryptoAssetSaved}
			/>
			<ConfirmModal onConfirmed={onDeleteConfirmed}
				title={t("crypto_account_cryptocurrency_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}/>
		</Fragment>
	);
};

export default CryptoAssetsList;
