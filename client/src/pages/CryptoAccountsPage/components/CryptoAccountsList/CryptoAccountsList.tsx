import React, { Fragment } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import CryptoAccount from '../CryptoAccount/CryptoAccount';
import { CryptoAccountEntity } from '../../../../models/crypto/CryptoAccountEntity';
import CryptoAccountModal from '../../modals/CryptoAccountModal/CryptoAccountModal';
import { useCryptoAccounts } from '../../hooks/useCryptoAccounts';
import Placeholder from '../../../../shared/components/Placeholder/Placeholder';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import SectionHeader from '../../../../shared/components/SectionHeader/SectionHeader';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';

interface Props {
    onDataChanged: () => void;
}

const CryptoAccountsList: React.FC<Props> = (props: Props) => {
    const { t } = useTranslation();

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
    } = useEntityModal<CryptoAccountEntity>();

    const {
        cryptoAccounts,
        createCryptoAccountEntity,
        updateCryptoAccountEntity,
        deleteCryptoAccountEntity,
    } = useCryptoAccounts();

    const onCryptoAccountSaved = executeWithCleanup(async (cryptoAccount: CryptoAccountEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createCryptoAccountEntity(cryptoAccount);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateCryptoAccountEntity(cryptoAccount);
        }
        props.onDataChanged();
    });

    const onDeleteConfirmed = handleDelete(async (cryptoAccount) => {
        await deleteCryptoAccountEntity(cryptoAccount);
        props.onDataChanged();
    });

    const getHeader = () => {
        const placeholderAddButton = (
            <AddButton
                buttonTitle={t("crypto_accounts_page_add")}
                onClick={onAddClicked}
            />
        );

        return cryptoAccounts.length ? (
            <SectionHeader
                title={t("header_cryptoaccounts")}
                onAdd={onAddClicked}
                addButtonTitle={t("crypto_accounts_page_add")}
            />
        ) : (
            <Placeholder text={t("crypto_accounts_page_no_crypto_accounts")}>
                {placeholderAddButton}
            </Placeholder>
        );
    };

    return (
        <Fragment>
            {getHeader()}
            <SimpleGrid pb={5} gap={4} templateColumns="repeat(auto-fill, minmax(400px, 3fr))">
                {cryptoAccounts.map((cryptoAccount: CryptoAccountEntity) => (
                    <CryptoAccount
                        cryptoAccount={cryptoAccount}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                        key={cryptoAccount.id}
                    />
                ))}
            </SimpleGrid>
            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("crypto_account_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
            <CryptoAccountModal
                cryptoAccount={activeEntity}
                modalRef={modalRef}
                onSaved={onCryptoAccountSaved}
            />
        </Fragment>
    );
};

export default CryptoAccountsList;
