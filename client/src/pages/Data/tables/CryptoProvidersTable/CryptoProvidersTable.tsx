import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { SiBinance } from "react-icons/si";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { Nullable } from "../../../../shared/utilities/nullable";
import { CryptoProviderEntity } from "../../../../models/crypto/CryptoProviderEntity";
import CryptoProviderModal from "../../modals/CryptoProviderModal/CryptoProviderModal";
import { useCryptoProviders } from "../../hooks/useCryptoProviders";
import { getCryptoProviderIconUrl } from "../../../../api/crypto/cryptoProviderApi";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import StoredIcon from "../../../../shared/components/StoredIcon";
import { useEntityModal } from "../../../../shared/hooks/useEntityModal";

const CryptoProvidersTable: React.FC = () => {
	const { t } = useTranslation();
	const {
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
		onActionEnded,
		handleDelete,
		executeWithCleanup
	} = useEntityModal<CryptoProviderEntity>();

	const {
		cryptoProviders,
		isCryptoProvidersLoading,
		createCryptoProviderEntity,
		updateCryptoProviderEntity,
		deleteCryptoProviderEntity
	} = useCryptoProviders();

	const onCryptoProviderSaved = executeWithCleanup(async (cryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
		const isModified = cryptoProviders.some(p => p.id === cryptoProvider.id);

		if (isModified) {
			await updateCryptoProviderEntity(cryptoProvider, icon);
		} else {
			await createCryptoProviderEntity(cryptoProvider, icon);
		}
	});

	const onCryptoProviderDeleteConfirmed = handleDelete(async (cryptoProvider) => {
		await deleteCryptoProviderEntity(cryptoProvider);
	});

	const columns: ColumnDef<CryptoProviderEntity>[] = useMemo(() => [
		{
			width: "50px",
			render: (cryptoProvider) => (
				<StoredIcon
					src={cryptoProvider.iconKey ? getCryptoProviderIconUrl(cryptoProvider.iconKey) : undefined}
					fallbackIcon={<SiBinance size={20} color="var(--chakra-colors-text_secondary)" />}
					size="md"
				/>
			)
		},
		{
			header: t("entity_crypto_provider_name"),
			render: (cryptoProvider) => <Text>{cryptoProvider.name}</Text>
		},
		{
			width: 10,
			render: (cryptoProvider) => (
				<Button
					borderColor="background_secondary"
					background="button_background_secondary"
					size={'sm'}
					onClick={() => onEditClicked(cryptoProvider)}
				>
					<Icon color="card_action_icon_primary">
						<MdEdit/>
					</Icon>
				</Button>
			)
		},
		{
			width: 10,
			render: (cryptoProvider) => (
				<Button
					borderColor="background_secondary"
					background="button_background_secondary"
					size={'sm'}
					onClick={() => onDeleteClicked(cryptoProvider)}
				>
					<Icon color="card_action_icon_danger">
						<MdDelete/>
					</Icon>
				</Button>
			)
		}
	], [t, onEditClicked, onDeleteClicked]);

	return <Box color="text_primary">
		<Box mb={4}>
			<Button background="action_primary" onClick={onAddClicked}>
				<Icon size='md'>
					<MdAdd/>
				</Icon>
				{t("entity_crypto_provider_add")}
			</Button>
		</Box>
		<DataTable
			data={cryptoProviders}
			columns={columns}
			keyExtractor={(item) => item.id}
			isLoading={isCryptoProvidersLoading}
			skeletonRows={5}
		/>
		<CryptoProviderModal
			onModalClosed={onActionEnded}
			cryptoProvider={activeEntity}
			modalRef={modalRef}
			onSaved={onCryptoProviderSaved}
		/>
		<ConfirmModal onConfirmed={onCryptoProviderDeleteConfirmed}
			title={t("crypto_providers_delete_title")}
			message={t("modals_delete_message")}
			confirmActionName={t("modals_delete_button")}
			ref={confirmModalRef}/>
	</Box>
}

export default CryptoProvidersTable;