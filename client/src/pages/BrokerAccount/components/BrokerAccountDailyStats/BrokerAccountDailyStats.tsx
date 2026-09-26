
import React, { Fragment, useCallback, useEffect, useState } from "react";

import { getDailyStats } from "../../../../api/brokers/brokerAccountSummaryApi";
import { Card, SimpleGrid, Stack, Table, Text, Link, Flex } from "@chakra-ui/react";
import { NavLink } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { BrokerAccountDailySecurityStatsEntity, BrokerAccountDailyStatsEntity } from "../../../../models/brokers/BrokerAccountDailyStatsEntity";
import { Nullable } from "../../../../shared/utilities/nullable";
import MoneyCard from "../../../../shared/components/MoneyCard/MoneyCard";
import { calculateDiff } from "../../../../shared/utilities/numericDiffsUtilities";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { formatTime } from "../../../../shared/utilities/formatters/dateFormatter";
import StatsCard from "../../../../shared/components/StatsCard/StatsCard";
import { getIconUrl } from "../../../../api/securities/securityApi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import StoredIcon from "../../../../shared/components/StoredIcon";
import RefreshButton from "../../../../shared/components/RefreshButton";

interface Props {
	brokerAccountId: Nullable<string>
	currencyName: string
}

const BrokerAccountDailyStats: React.FC<Props> = ({ brokerAccountId, currencyName }) => {
	const { t, i18n } = useTranslation();

	const [dailyStats, setDailyStats] = useState<Nullable<BrokerAccountDailyStatsEntity>>(null);

	const [isRefreshing, setIsRefreshing] = useState(false);

	const fetchDailyStats = useCallback(async (showRefresh: boolean = false) => {
		if (showRefresh) {
			setIsRefreshing(true);
		}
		
		const fetchedDailyStats = await getDailyStats(brokerAccountId);
		if (!fetchedDailyStats) {
			return;
		}
		
		setDailyStats(fetchedDailyStats);

		if (showRefresh) {
			setIsRefreshing(false);
		}
	}, [brokerAccountId]);

	useEffect(() => {
		const fetchData = async () => {
			if (dailyStats) {
				return;
			}
			await fetchDailyStats();
		};
		fetchData();
	}, []);

	const formatStat = useCallback((stat: BrokerAccountDailySecurityStatsEntity) => {
		const currencyName = stat.security.currency.name;
		const relativeStartPrice = stat.previousDayClosePrice || stat.startPrice;
		const { profitAndLoss, rawProfitAndLoss, profitAndLossPercentage, color } = calculateDiff(stat.currentPrice, 
			relativeStartPrice, currencyName);

		const minDiff = formatMoneyByCurrencyCulture(stat.minPrice - stat.currentPrice, currencyName);
		const maxDiff = formatMoneyByCurrencyCulture(stat.maxPrice - stat.currentPrice, currencyName);

		const iconUrl = stat.security.iconKey ? getIconUrl(stat.security.iconKey) : undefined;

		return <Table.Row key={stat.security.id} color="text_primary" backgroundColor="background_primary">
			<Table.Cell>
				<Link asChild color="text_primary">
					<NavLink to={`/security/${stat.security.id}`}>
						<Flex align="center" gap={2}>
							<StoredIcon
								src={iconUrl}
								fallbackIcon={<HiOutlineBuildingOffice2 size={16} color="var(--chakra-colors-text_secondary)" />}
								size="sm"
							/>
							{stat.security.ticker}
						</Flex>
					</NavLink>
				</Link>
			</Table.Cell>
			<Table.Cell>{formatMoneyByCurrencyCulture(stat.startPrice, currencyName)}</Table.Cell>
			<Table.Cell>{formatMoneyByCurrencyCulture(stat.minPrice, currencyName)} ({minDiff})</Table.Cell>
			<Table.Cell>{formatMoneyByCurrencyCulture(stat.maxPrice, currencyName)} ({maxDiff})</Table.Cell>
			<Table.Cell>{formatMoneyByCurrencyCulture(stat.previousDayClosePrice, currencyName)}</Table.Cell>
			<Table.Cell>{formatMoneyByCurrencyCulture(stat.currentPrice, currencyName)}</Table.Cell>
			<Table.Cell color={color}>{profitAndLoss}</Table.Cell>
			<Table.Cell color={color}>{profitAndLossPercentage}%</Table.Cell>
			<Table.Cell color={color}>{formatMoneyByCurrencyCulture(rawProfitAndLoss * stat.quantity, currencyName)}</Table.Cell>
		</Table.Row>
	}, []);

	if (!dailyStats) {
		return <Fragment/>
	}

	const { profitAndLoss, profitAndLossPercentage, color } = calculateDiff(dailyStats.currentPortfolioValue, 
		dailyStats.startPortfolioValue, currencyName);

	return (
		<Stack gapY={4}>
			<Stack direction="row" justifyContent="start" alignItems="center" gap={3}>
				<Text fontSize="2xl" fontWeight={800} color="text_primary">
					{t("broker_account_daily_stats_title")}
				</Text>
				<RefreshButton
					isRefreshing={isRefreshing}
					showClockIcon
					title={t("broker_account_daily_stats_updated_at", {
						time: formatTime(new Date(dailyStats.fetchDate), i18n)
					})}
					onClick={() => fetchDailyStats(true)}
				/>
			</Stack>
			<SimpleGrid columns={2} gap={4}>
				<MoneyCard title={t("broker_account_start_portfolio_title")} value={dailyStats.startPortfolioValue} currency={currencyName}/>
				<StatsCard color={color} title={t("broker_account_current_portfolio_title")} 
					value={`${formatMoneyByCurrencyCulture(dailyStats.currentPortfolioValue, currencyName)} (${profitAndLoss} | ${profitAndLossPercentage}%)`} />
			</SimpleGrid>
			<Card.Root backgroundColor="background_primary" borderColor="border_primary" color="text_primary">
				<Card.Header>
					{t("broker_account_daily_stats_dynamics")}
				</Card.Header>
				<Card.Body fontSize="xl" fontWeight={700}>
					<Table.Root>
						<Table.Header>
							<Table.Row backgroundColor="background_primary">
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_security_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_open_value_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_min_value_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_max_value_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_previous_close_value_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_current_value_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_diff_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_percentage_diff_column")}</Table.ColumnHeader>
								<Table.ColumnHeader color="text_primary">{t("broker_account_daily_stats_total_diff_column")}</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
						{
							dailyStats.brokerAccountDailySecurityStats.map((stat) => formatStat(stat))
						}
						</Table.Body>
					</Table.Root>
				</Card.Body>
			</Card.Root>
		</Stack>
	);
};

export default BrokerAccountDailyStats;