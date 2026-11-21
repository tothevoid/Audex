import { Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CardsGrid from "@/shared/components/CardsGrid";
import { useCryptocurrencies } from "./hooks/useCryptocurrencies";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import Cryptocurrency from "./components/Cryptocurrency/Cryptocurrency";
import CryptocurrencyModal from "./modals/CryptocurrencyModal";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import { useConfirm } from "@/shared/hooks/useConfirm";
import AddButton from "@/shared/components/AddButton/AddButton";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";
import { useEntityModal } from "@/shared/hooks/useEntityModal";

const CryptocurrenciesPage: React.FC = () => {
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const {
        activeEntity,
        modalRef,
        onAddClicked,
        onEditClicked,
        mode,
        onActionEnded
    } = useEntityModal<CryptocurrencyEntity>();


    const {
        cryptocurrencies,
        createCryptocurrencyEntity,
        updateCryptocurrencyEntity,
        deleteCryptocurrencyEntity
    } = useCryptocurrencies();

    const onCryptocurrencySaved = (cryptocurrency: CryptocurrencyEntity, file: File | null) => {
        if (mode === ActiveEntityMode.Add) {
            createCryptocurrencyEntity(cryptocurrency, file);
        } else {
            updateCryptocurrencyEntity(cryptocurrency, file);
        }
        onActionEnded();
    };

    const getHeader = () => {
        const placeholderAddButton = (
            <AddButton
                onClick={onAddClicked}
                buttonTitle={t("cryptocurrencies_page_add")}
            />
        );

        return cryptocurrencies.length ? (
            <SectionHeader
                title={t("header_cryptocurrencies")}
                onAdd={onAddClicked}
                addButtonTitle={t("cryptocurrencies_page_add")}
            />
        ) : (
            <Placeholder text={t("cryptocurrencies_page_no_cryptocurrencies")}>
                {placeholderAddButton}
            </Placeholder>
        );
    };

    const onDeleteClicked = useCallback(async (cryptocurrency: CryptocurrencyEntity) => {
        const confirmed = await confirmDelete(t("cryptocurrency_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteCryptocurrencyEntity(cryptocurrency);
    }, [confirmDelete, deleteCryptocurrencyEntity, t]);

    const onModalClosed = () => {
        onActionEnded();
    };

    return <Fragment>
        {getHeader()}
        <CardsGrid>
            {
                cryptocurrencies.map((cryptocurrency: CryptocurrencyEntity) =>
                    <Cryptocurrency key={cryptocurrency.id}
                        cryptocurrency={cryptocurrency}
                        onEditClicked={onEditClicked}
                        onDeletedClicked={onDeleteClicked} />)
            }
        </CardsGrid>
        <CryptocurrencyModal onModalClosed={onModalClosed} cryptocurrency={activeEntity} modalRef={modalRef} onSaved={onCryptocurrencySaved} />
    </Fragment>;
};

export default CryptocurrenciesPage;