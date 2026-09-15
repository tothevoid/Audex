import { useTranslation } from "react-i18next";
import { Box, Card, Grid, Stack} from "@chakra-ui/react";
import { Text} from "@chakra-ui/react";
import { useUserProfile } from "../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { Fragment, useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard/dashboardApi";
import { GlobalDashboard, DistributionModel } from "../../models/dashboard/DashboardEntity";
import { formatMoneyByCurrencyCulture } from "../../shared/utilities/formatters/moneyFormatter";
import DistributionChart from "./components/DistributionChart";
import Placeholder from "../../shared/components/Placeholder/Placeholder";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import { Nullable } from "../../shared/utilities/nullable";

interface State {
	dashboard: GlobalDashboard | null
}

const DashboardPage: React.FC = () => {
	const { t } = useTranslation();

	const { user } = useUserProfile();

	const [state, setState] = useState<State>({dashboard: null});

	const initDashboardData = async () => {
		const dashboard = await getDashboard();

		if (!dashboard) {
			return;
		}

		setState((currentState) => {
			return {...currentState, dashboard};
		});
	}

	useEffect(() => {
		initDashboardData();
	}, []);

	useEffect(() => {
		initDashboardData();
	}, [user?.currency]);

	const currency = user?.currency.name ?? "";

	if (!state.dashboard || !user) {
		return <Fragment/>
	}

	const {dashboard} = state;

	const totalsData: DistributionModel[] = [
		{ name: t("dashboard_cash"), convertedAmount: dashboard.accountsGlobalDashboard.totalCash, currency, amount: dashboard.accountsGlobalDashboard.totalCash },
		{ name: t("dashboard_securities"), convertedAmount: dashboard.brokerAccountsGlobalDashboard.total, currency, amount: dashboard.brokerAccountsGlobalDashboard.total},
		{ name: t("dashboard_deposits"), convertedAmount: dashboard.depositsGlobalDashboard.totalStartedAmount, currency, amount: dashboard.depositsGlobalDashboard.totalStartedAmount},
		{ name: t("dashboard_deposit_incomes"), convertedAmount: dashboard.depositsGlobalDashboard.totalEarned, currency, amount: dashboard.depositsGlobalDashboard.totalEarned },
		{ name: t("dashboard_bank_accounts"), convertedAmount: dashboard.accountsGlobalDashboard.totalBankAccount, currency, amount: dashboard.accountsGlobalDashboard.totalBankAccount },
		{ name: t("dashboard_debts"), convertedAmount: dashboard.debtsGlobalDashboard.total, currency, amount: dashboard.debtsGlobalDashboard.total },
		{ name: t("dashboard_crypto_account"), convertedAmount: dashboard.cryptoAccountsGlobalDashboard.total, currency, amount: dashboard.cryptoAccountsGlobalDashboard.total }
	].filter(item => (item.convertedAmount ?? 0) > 0);

	const formatDistributionCard = (title: string, total: Nullable<number>, distribution: DistributionModel[]) => {
		if (!distribution.length) {
			return <Fragment/>
		}

		return <Card.Root backgroundColor="background_primary" borderColor="border_primary">
			<Card.Body color="text_primary">
				<Stack gapY={2}>
					<Text fontWeight={700} fontSize={"xl"}>
						{title}:
						{total && " "}
						{total && formatMoneyByCurrencyCulture(total, currency)}
					</Text>
					<DistributionChart data={distribution} mainCurrency={user.currency.name}/>
				</Stack>
			</Card.Body>
		</Card.Root>
	}

	const assetsSubCharts = [
		formatDistributionCard(t("dashboard_cash"), dashboard.accountsGlobalDashboard.totalCash, dashboard.accountsGlobalDashboard.cashDistribution),
		formatDistributionCard(t("dashboard_securities"), dashboard.brokerAccountsGlobalDashboard.total, dashboard.brokerAccountsGlobalDashboard.distribution),
		formatDistributionCard(t("dashboard_deposits"), dashboard.depositsGlobalDashboard.totalStartedAmount, dashboard.depositsGlobalDashboard.startedAmountDistribution),
		formatDistributionCard(t("dashboard_deposit_incomes"), dashboard.depositsGlobalDashboard.totalEarned, dashboard.depositsGlobalDashboard.earningsDistribution),
		formatDistributionCard(t("dashboard_bank_accounts"), dashboard.accountsGlobalDashboard.totalBankAccount, dashboard.accountsGlobalDashboard.bankAccountsDistribution),
		formatDistributionCard(t("dashboard_debts"), dashboard.debtsGlobalDashboard.total, dashboard.debtsGlobalDashboard.distribution),
		formatDistributionCard(t("dashboard_crypto_account"), dashboard.cryptoAccountsGlobalDashboard.total, dashboard.cryptoAccountsGlobalDashboard.distribution),
		formatDistributionCard(t("dashboard_banks"), null, dashboard.banksGlobalDashboard.distribution)
	];

	const transactionsStats = [
		formatDistributionCard(t("dashboard_transactions_spents"), dashboard.transactionsGlobalDashboard.spentsTotal, dashboard.transactionsGlobalDashboard.spentsDistribution),
		formatDistributionCard(t("dashboard_transactions_incomes"), dashboard.transactionsGlobalDashboard.incomesTotal, dashboard.transactionsGlobalDashboard.incomesDistribution)
	]

	const getChart = () => {
		return totalsData.length > 0 && <Card.Root backgroundColor="background_primary" borderColor="border_primary">
			<Card.Body color="text_primary">
				<Grid templateColumns="repeat(3, 1fr)">
					<Box>
						<Text fontWeight={700} fontSize={"xl"}>{t("dashboard_total")}: {formatMoneyByCurrencyCulture(dashboard?.total ?? 0, currency)}</Text>
					</Box>
					<DistributionChart data={totalsData} mainCurrency={user.currency.name}/>
				</Grid>
			</Card.Body>
		</Card.Root>
	}

	if (!totalsData.length) {
		return <Placeholder text={t("dashboard_empty")}/>
	}

	return (
		<PageContainer color="text_primary">
			<Text fontWeight={900} fontSize={"3xl"}>{t("dashboard_title")}</Text>
			<Stack gap={5}>
				{getChart()}
				<Grid gap={5} templateColumns="repeat(2, 1fr)">
					{assetsSubCharts}
				</Grid>
				<Grid gap={5} templateColumns="repeat(2, 1fr)">
					{transactionsStats}
				</Grid>
			</Stack>
		</PageContainer>
	)
}

export default DashboardPage;
