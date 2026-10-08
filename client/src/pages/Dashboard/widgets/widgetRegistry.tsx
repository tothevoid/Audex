import React from "react";
import { DashboardWidgetType, WidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor, WidgetTemplateInfo } from "./types";
import { oilWidgetDescriptor } from "./Oil";
import { securitiesDailyWidgetDescriptor } from "./SecuritiesDaily";
import { currencyRatesWidgetDescriptor } from "./CurrencyRates";
import { indicesWidgetDescriptor } from "./Indices";
import { totalBalanceWidgetDescriptor } from "./TotalBalance";
import {
    cashDistributionWidgetDescriptor,
    bankAccountsDistributionWidgetDescriptor,
    securitiesDistributionWidgetDescriptor,
    depositsDistributionWidgetDescriptor,
    depositIncomesDistributionWidgetDescriptor,
    debtsDistributionWidgetDescriptor,
    cryptoDistributionWidgetDescriptor,
    banksDistributionWidgetDescriptor,
    spentsDistributionWidgetDescriptor,
    incomesDistributionWidgetDescriptor
} from "./Distribution";

const activeDescriptors: Record<WidgetType, WidgetDescriptor<any>> = {
    [DashboardWidgetType.TotalBalance]: totalBalanceWidgetDescriptor,
    [DashboardWidgetType.CashDistribution]: cashDistributionWidgetDescriptor,
    [DashboardWidgetType.BankAccountsDistribution]: bankAccountsDistributionWidgetDescriptor,
    [DashboardWidgetType.SecuritiesDistribution]: securitiesDistributionWidgetDescriptor,
    [DashboardWidgetType.DepositsDistribution]: depositsDistributionWidgetDescriptor,
    [DashboardWidgetType.DepositIncomesDistribution]: depositIncomesDistributionWidgetDescriptor,
    [DashboardWidgetType.DebtsDistribution]: debtsDistributionWidgetDescriptor,
    [DashboardWidgetType.CryptoDistribution]: cryptoDistributionWidgetDescriptor,
    [DashboardWidgetType.BanksDistribution]: banksDistributionWidgetDescriptor,
    [DashboardWidgetType.SpentsDistribution]: spentsDistributionWidgetDescriptor,
    [DashboardWidgetType.IncomesDistribution]: incomesDistributionWidgetDescriptor,
    [DashboardWidgetType.CurrencyRates]: currencyRatesWidgetDescriptor,
    [DashboardWidgetType.Indices]: indicesWidgetDescriptor,
    [DashboardWidgetType.SecuritiesDaily]: securitiesDailyWidgetDescriptor,
    [DashboardWidgetType.Oil]: oilWidgetDescriptor
};

export const getWidgetDescriptor = (type: WidgetType): WidgetDescriptor<any> | undefined => {
    return activeDescriptors[type];
};

export const getAllWidgetTemplates = (): WidgetTemplateInfo[] => {
    return Object.values(activeDescriptors).map((descriptor) => descriptor.template);
};

export const getWidgetIcon = (type: WidgetType): React.ReactNode => {
    return activeDescriptors[type]?.template.icon;
};
