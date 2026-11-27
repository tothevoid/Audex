import { Box } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { SiBinance } from "react-icons/si";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { Nullable } from "@/shared/utilities/nullable";
import { CryptoProviderEntity } from "@/models/crypto/CryptoProviderEntity";
import CryptoProviderModal from "@/pages/Data/modals/CryptoProviderModal/CryptoProviderModal";
import { getCryptoProviderIconUrl } from "@/api/crypto/cryptoProviderApi";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import DataTableActiveCheckbox from "@/shared/components/DataTable/DataTableActiveCheckbox";
import DataTableNameCell from "@/shared/components/DataTable/DataTableNameCell";
import DataTableRowActions from "@/shared/components/DataTable/DataTableRowActions";
import DataTableFilterBar from "@/pages/Data/components/DataTableFilterBar/DataTableFilterBar";
import { useDataTableFilter } from "@/pages/Data/hooks/useDataTableFilter";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { notify } from "@/shared/components/Toaster";
import {
	useCreateCryptoProviderMutation,
	useCryptoProviders,
	useDeleteCryptoProviderMutation,
	useUpdateCryptoProviderMutation,
} from "@/shared/hooks/queries/useCryptoProviders";

const FILTER_OPTIONS = { hasActiveFilter: true };

const CryptoProvidersTable: React.FC = () => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();
	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		onActionEnded,
	} = useEntityModal<CryptoProviderEntity>();

	const { data: cryptoProviders = [], isLoading } = useCryptoProviders();
	const createCryptoProviderMutation = useCreateCryptoProviderMutation();
	const updateCryptoProviderMutation = useUpdateCryptoProviderMutation();
	const deleteCryptoProviderMutation = useDeleteCryptoProviderMutation();

	const {
		filteredItems: filteredCryptoProviders,
		searchText,
		onSearchTextChanged,
		onlyActive,
		onOnlyActiveChanged,
		showSearch,
		showActiveFilter,
	} = useDataTableFilter(cryptoProviders, FILTER_OPTIONS);

	const onCryptoProviderSaved = async (cryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
		const isModified = cryptoProviders.some((provider) => provider.id === cryptoProvider.id);

		if (isModified) {
			const updatedResult = await updateCryptoProviderMutation.mutateAsync({ cryptoProvider, icon });
			if (updatedResult) {
				notify.success(t("crypto_provider_toast_updated_title"), t("crypto_provider_toast_updated_desc", { name: cryptoProvider.name }));
			}
		} else {
			const createdResult = await createCryptoProviderMutation.mutateAsync({ cryptoProvider, icon });
			if (createdResult) {
				notify.success(t("crypto_provider_toast_created_title"), t("crypto_provider_toast_created_desc", { name: createdResult.name }));
			}
		}
		onActionEnded();
	};

	const onDeleteClicked = useCallback(async (cryptoProvider: CryptoProviderEntity) => {
		const confirmed = await confirmDelete(t("crypto_providers_delete_title"));
		if (!confirmed) {
			return;
		}
		const isDeleted = await deleteCryptoProviderMutation.mutateAsync(cryptoProvider.id);
		if (isDeleted) {
			notify.success(t("crypto_provider_toast_deleted_title"), t("crypto_provider_toast_deleted_desc", { name: cryptoProvider.name }));
		}
	}, [confirmDelete, deleteCryptoProviderMutation, t]);

	const onActiveChanged = useCallback(async (cryptoProvider: CryptoProviderEntity, isChecked: boolean) => {
		if (cryptoProvider.active === isChecked) {
			return;
		}

		const updatedResult = await updateCryptoProviderMutation.mutateAsync({
			cryptoProvider: { ...cryptoProvider, active: isChecked },
			icon: null,
		});
		if (updatedResult) {
			notify.success(t("crypto_provider_toast_updated_title"), t("crypto_provider_toast_updated_desc", { name: cryptoProvider.name }));
		}
	}, [updateCryptoProviderMutation, t]);

	const columns: ColumnDef<CryptoProviderEntity>[] = useMemo(() => [
		{
			header: t("entity_crypto_provider_name"),
			render: (cryptoProvider) => (
				<DataTableNameCell
					name={cryptoProvider.name}
					iconSrc={cryptoProvider.iconKey ? getCryptoProviderIconUrl(cryptoProvider.iconKey) : undefined}
					fallbackIcon={<SiBinance size={20} color="var(--chakra-colors-text_secondary)" />}
				/>
			)
		},
		{
			header: t("entity_crypto_provider_active"),
			width: 10,
			render: (cryptoProvider) => (
				<DataTableActiveCheckbox
					checked={cryptoProvider.active}
					disabled={updateCryptoProviderMutation.isPending}
					onChange={(isChecked) => onActiveChanged(cryptoProvider, isChecked)}
				/>
			)
		},
		{
			width: "1%",
			align: "end",
			render: (cryptoProvider) => (
				<DataTableRowActions
					onEdit={() => onEditClicked(cryptoProvider)}
					onDelete={() => onDeleteClicked(cryptoProvider)}
				/>
			)
		}
	], [t, onEditClicked, onDeleteClicked, onActiveChanged, updateCryptoProviderMutation.isPending]);

	return <Box color="text_primary">
		<SectionHeader
			title={t("data_tab_crypto_providers")}
			onAdd={onAddClicked}
			addButtonTitle={t("entity_crypto_provider_add")}
		/>
		<DataTableFilterBar
			showSearch={showSearch}
			searchText={searchText}
			onSearchTextChanged={onSearchTextChanged}
			showActiveFilter={showActiveFilter}
			onlyActive={onlyActive}
			onOnlyActiveChanged={onOnlyActiveChanged}
		/>
		<DataTable
			data={filteredCryptoProviders}
			columns={columns}
			keyExtractor={(item) => item.id}
			isLoading={isLoading}
			skeletonRows={5}
		/>
		<CryptoProviderModal
			onModalClosed={onActionEnded}
			cryptoProvider={activeEntity}
			modalRef={modalRef}
			onSaved={onCryptoProviderSaved}
		/>
	</Box>;
};

export default CryptoProvidersTable;