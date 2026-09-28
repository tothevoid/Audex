import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CryptoAccountHeader from "@/pages/CryptoAccountPage/components/CryptoAccountHeader/CryptoAccountHeader";
import CryptoAccountTabs from "@/pages/CryptoAccountPage/components/CryptoAccountTabs/CryptoAccountTabs";
import { getTotalBalance } from "@/api/crypto/cryptoAccountCryptocurrencyApi";

const CryptoAccountsPage: React.FC = () => {
    const { t } = useTranslation();
    const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);
    const [dataVersion, setDataVersion] = useState<number>(0);

    const fetchData = useCallback(async () => {
        const balance = await getTotalBalance();
        setTotalBalanceUsd(balance);
        setDataVersion((v) => v + 1);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <Fragment>
            <CryptoAccountHeader
                title={t("all_crypto_accounts_header")}
                totalBalanceUsd={totalBalanceUsd}
            />
            <CryptoAccountTabs onDataChanged={fetchData} dataVersion={dataVersion} />
        </Fragment>
    );
};

export default CryptoAccountsPage;