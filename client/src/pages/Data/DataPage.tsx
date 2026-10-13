import { useParams } from "react-router-dom";
import BanksTable from "./tables/BanksTable/BanksTable";
import BrokerAccountTypesTable from "./tables/BrokerAccountTypesTable/BrokerAccountTypesTable";
import BrokersTable from "./tables/BrokersTable/BrokersTable";
import CurrenciesTable from "./tables/CurrenciesTable/CurrenciesTable";
import TransactionTypesTable from "./tables/TransactionTypesTable/TransactionTypesTable";
import React from "react";
import DataLayout from "./components/DataLayout/DataLayout";
import CryptoProvidersTable from "./tables/CryptoProvidersTable/CryptoProvidersTable";

const renderTabContent = (tabKey: string) => {
    switch (tabKey) {
        case "currencies":
            return <CurrenciesTable />;
        case "banks":
            return <BanksTable />;
        case "broker_account_types":
            return <BrokerAccountTypesTable />;
        case "brokers":
            return <BrokersTable />;
        case "crypto_providers":
            return <CryptoProvidersTable />;
        case "transaction_types":
        default:
            return <TransactionTypesTable />;
    }
};

const DataPage: React.FC = () => {
    const { tab = "transaction_types" } = useParams();

    return (
        <DataLayout>
            {renderTabContent(tab)}
        </DataLayout>
    );
};

export default DataPage;