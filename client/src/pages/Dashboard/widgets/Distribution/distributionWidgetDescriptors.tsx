import {
    MdAttachMoney,
    MdCreditCard,
    MdShowChart,
    MdSavings,
    MdTrendingUp,
    MdReceipt,
    MdCurrencyBitcoin,
    MdAccountBalance,
    MdTrendingDown
} from "react-icons/md";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import {
    CashDistributionWidget,
    BankAccountsDistributionWidget,
    SecuritiesDistributionWidget,
    DepositsDistributionWidget,
    DepositIncomesDistributionWidget,
    DebtsDistributionWidget,
    CryptoDistributionWidget,
    BanksDistributionWidget,
    SpentsDistributionWidget,
    IncomesDistributionWidget
} from "./distributionWidgets";

export const cashDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.CashDistribution,
    template: {
        type: DashboardWidgetType.CashDistribution,
        titleKey: "widget_cash_title",
        descKey: "widget_cash_desc",
        icon: <MdAttachMoney size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: CashDistributionWidget,
    getDefaultSettings: () => ({})
};

export const bankAccountsDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.BankAccountsDistribution,
    template: {
        type: DashboardWidgetType.BankAccountsDistribution,
        titleKey: "widget_bank_accounts_title",
        descKey: "widget_bank_accounts_desc",
        icon: <MdCreditCard size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: BankAccountsDistributionWidget,
    getDefaultSettings: () => ({})
};

export const securitiesDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.SecuritiesDistribution,
    template: {
        type: DashboardWidgetType.SecuritiesDistribution,
        titleKey: "widget_securities_title",
        descKey: "widget_securities_desc",
        icon: <MdShowChart size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: SecuritiesDistributionWidget,
    getDefaultSettings: () => ({})
};

export const depositsDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.DepositsDistribution,
    template: {
        type: DashboardWidgetType.DepositsDistribution,
        titleKey: "widget_deposits_title",
        descKey: "widget_deposits_desc",
        icon: <MdSavings size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: DepositsDistributionWidget,
    getDefaultSettings: () => ({})
};

export const depositIncomesDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.DepositIncomesDistribution,
    template: {
        type: DashboardWidgetType.DepositIncomesDistribution,
        titleKey: "widget_deposit_incomes_title",
        descKey: "widget_deposit_incomes_desc",
        icon: <MdTrendingUp size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: DepositIncomesDistributionWidget,
    getDefaultSettings: () => ({})
};

export const debtsDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.DebtsDistribution,
    template: {
        type: DashboardWidgetType.DebtsDistribution,
        titleKey: "widget_debts_title",
        descKey: "widget_debts_desc",
        icon: <MdReceipt size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: DebtsDistributionWidget,
    getDefaultSettings: () => ({})
};

export const cryptoDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.CryptoDistribution,
    template: {
        type: DashboardWidgetType.CryptoDistribution,
        titleKey: "widget_crypto_title",
        descKey: "widget_crypto_desc",
        icon: <MdCurrencyBitcoin size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: CryptoDistributionWidget,
    getDefaultSettings: () => ({})
};

export const banksDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.BanksDistribution,
    template: {
        type: DashboardWidgetType.BanksDistribution,
        titleKey: "widget_banks_title",
        descKey: "widget_banks_desc",
        icon: <MdAccountBalance size={20} />,
        defaultW: 4,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: BanksDistributionWidget,
    getDefaultSettings: () => ({})
};

export const spentsDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.SpentsDistribution,
    template: {
        type: DashboardWidgetType.SpentsDistribution,
        titleKey: "widget_spents_title",
        descKey: "widget_spents_desc",
        icon: <MdTrendingDown size={20} />,
        defaultW: 4,
        defaultH: 4,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: SpentsDistributionWidget,
    getDefaultSettings: () => ({})
};

export const incomesDistributionWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.IncomesDistribution,
    template: {
        type: DashboardWidgetType.IncomesDistribution,
        titleKey: "widget_incomes_title",
        descKey: "widget_incomes_desc",
        icon: <MdTrendingUp size={20} />,
        defaultW: 4,
        defaultH: 4,
        minW: 3,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: IncomesDistributionWidget,
    getDefaultSettings: () => ({})
};
