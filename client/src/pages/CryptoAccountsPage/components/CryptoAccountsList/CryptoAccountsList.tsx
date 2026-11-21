import React, { Fragment, useCallback } from 'react';
import CardsGrid from '@/shared/components/CardsGrid';
import { useTranslation } from 'react-i18next';
import CryptoAccount from '@/pages/CryptoAccountsPage/components/CryptoAccount/CryptoAccount';
import { CryptoAccountEntity } from '@/models/crypto/CryptoAccountEntity';
import CryptoAccountModal from '@/pages/CryptoAccountsPage/modals/CryptoAccountModal/CryptoAccountModal';
import { useCryptoAccounts } from '@/pages/CryptoAccountsPage/hooks/useCryptoAccounts';
import Placeholder from '@/shared/components/Placeholder/Placeholder';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import AddButton from '@/shared/components/AddButton/AddButton';
import SectionHeader from '@/shared/components/SectionHeader/SectionHeader';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';

interface Props {
    onDataChanged: () => void;
}

const CryptoAccountsList: React.FC<Props> = (props: Props) => {
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const {
        activeEntity,
        modalRef,
        onAddClicked,
        onEditClicked,
        mode,
        onActionEnded,
    } = useEntityModal<CryptoAccountEntity>();

    const {
        cryptoAccounts,
        createCryptoAccountEntity,
        updateCryptoAccountEntity,
        deleteCryptoAccountEntity,
    } = useCryptoAccounts();

    const onCryptoAccountSaved = async (cryptoAccount: CryptoAccountEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createCryptoAccountEntity(cryptoAccount);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateCryptoAccountEntity(cryptoAccount);
        }
        props.onDataChanged();
        onActionEnded();
    };

    const onDeleteClicked = useCallback(async (cryptoAccount: CryptoAccountEntity) => {
        const confirmed = await confirmDelete(t("crypto_account_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteCryptoAccountEntity(cryptoAccount);
        props.onDataChanged();
    }, [confirmDelete, deleteCryptoAccountEntity, props, t]);

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
            <CardsGrid>
                {cryptoAccounts.map((cryptoAccount: CryptoAccountEntity) => (
                    <CryptoAccount
                        cryptoAccount={cryptoAccount}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                        key={cryptoAccount.id}
                    />
                ))}
            </CardsGrid>
            <CryptoAccountModal
                cryptoAccount={activeEntity}
                modalRef={modalRef}
                onSaved={onCryptoAccountSaved}
            />
        </Fragment>
    );
};

export default CryptoAccountsList;
