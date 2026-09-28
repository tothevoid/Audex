import { useParams } from "react-router-dom";
import BanksTable from "./tables/BanksTable/BanksTable";
import BrokerAccountTypesTable from "./tables/BrokerAccountTypesTable/BrokerAccountTypesTable";
import BrokersTable from "./tables/BrokersTable/BrokersTable";
import CurrenciesTable from "./tables/CurrenciesTable/CurrenciesTable";
import TransactionTypesTable from "./tables/TransactionTypesTable/TransactionTypesTable";
import { FC, Fragment } from "react";
import DataLayout from "./components/DataLayout/DataLayout";
import CryptoProvidersTable from "./tables/CryptoProvidersTable/CryptoProvidersTable";

const DataPage = () => {
    const tabs = new Map<string, FC>(
        [
            ["transaction_types", TransactionTypesTable],
            ["currencies", CurrenciesTable],
            ["banks", BanksTable],
            ["broker_account_types", BrokerAccountTypesTable],
            ["brokers", BrokersTable],
            ["crypto_providers", CryptoProvidersTable]
        ]
    );

    const { tab = [...tabs.keys()][0] } = useParams(); // Получаем текущий таб из URL
    const Component = tabs.get(tab);

    if (!Component){
        return <Fragment/>;
    }

    return (
        <DataLayout>
            <Component/>
        </DataLayout>
    );
};

export default DataPage;