import React from "react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "@/pages/Dashboard/widgets/types";
import { DistributionWidgetBase } from "./DistributionWidgetBase";

export const TotalBalanceWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetTotalBalanceWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const CashDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetCashDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const BankAccountsDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetBankAccountsDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const SecuritiesDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetSecuritiesDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const DepositsDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetDepositsDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const DepositIncomesDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetDepositIncomesDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const DebtsDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetDebtsDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const CryptoDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetCryptoDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const BanksDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetBanksDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const SpentsDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetSpentsDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};

export const IncomesDistributionWidget: React.FC<WidgetComponentProps> = (props) => {
    const { t } = useTranslation();
    return (
        <DistributionWidgetBase
            {...props}
            endpoint="GetIncomesDistributionWidgetData"
            emptyText={t("dashboard_empty")}
        />
    );
};
