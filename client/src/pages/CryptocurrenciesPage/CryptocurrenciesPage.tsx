import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Flex, SimpleGrid } from "@chakra-ui/react";
import { useCryptocurrencies } from "./hooks/useCryptocurrencies";
import { CryptocurrencyEntity } from "../../models/crypto/CryptocurrencyEntity";
import Cryptocurrency from "./components/Cryptocurrency/Cryptocurrency";
import CryptocurrencyModal from "./modals/CryptocurrencyModal";
import Placeholder from "../../shared/components/Placeholder/Placeholder";
import { ConfirmModal } from "../../shared/modals/ConfirmModal/ConfirmModal";
import AddButton from "../../shared/components/AddButton/AddButton";
import { ActiveEntityMode } from "../../shared/enums/activeEntityMode";
import { useEntityModal } from "../../shared/hooks/useEntityModal";

const CryptocurrenciesPage: React.FC = () => {
    const { t } = useTranslation();
    
    const { 
        activeEntity,
        modalRef,
        confirmModalRef,
        onAddClicked,
        onEditClicked,
        onDeleteClicked,
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
    }

    const getHeader = () => {
        const addButton = <AddButton onClick={onAddClicked} 
            buttonTitle={t("security_page_summary_add")}/>

        return cryptocurrencies.length ?
            <Flex justifyContent="space-between" alignItems="center" pb={5}>
                {addButton}
            </Flex>:
            <Placeholder text={t("cryptocurrencies_page_no_cryptocurrencies")}>
                {addButton}
            </Placeholder>
    }

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set")
        }

        await deleteCryptocurrencyEntity(activeEntity);
        onActionEnded();
    }

    const onModalClosed = () => {
        onActionEnded();
    }

    return <Fragment>
        {getHeader()}
        <SimpleGrid pt={5} pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(300px, 3fr))'>
            {
                cryptocurrencies.map((cryptocurrency: CryptocurrencyEntity) => 
                    <Cryptocurrency key={cryptocurrency.id} 
                        cryptocurrency={cryptocurrency} 
                        onEditClicked={onEditClicked} 
                        onDeletedClicked={onDeleteClicked}/>)
            }
        </SimpleGrid>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("cryptocurrency_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        <CryptocurrencyModal onModalClosed={onModalClosed} cryptocurrency={activeEntity} modalRef={modalRef} onSaved={onCryptocurrencySaved}/>
    </Fragment>
}

export default CryptocurrenciesPage;