import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { getSecurityById, getSecurityStats } from "@/api/securities/securityApi";
import { SecurityEntity } from "@/models/securities/SecurityEntity";
import { Stack, Tabs } from "@chakra-ui/react";
import DividendList from "./components/DividendsList/DividendList";
import SecurityHistory from "./components/SecurityHistory/SecurityHistory";
import SecurityTransactionsChart from "./components/SecurityTransactionsChart/SecurityTransactionsChart";
import SecurityHeader from "./components/SecurityHeader/SecurityHeader";
import { SecurityStats } from "@/models/securities/SecurityStats";
import { GrTransaction } from "react-icons/gr";
import { MdHistory } from "react-icons/md";
import { PiCoinsLight } from "react-icons/pi";
import ResponsiveTabsList, { ResponsiveTabItem } from "@/shared/components/ResponsiveTabs/ResponsiveTabsList";

interface State {
	security: SecurityEntity,
	securityStats: SecurityStats
}

const SecurityPage: React.FC = () => {
	const { t } = useTranslation();

	const { securityId } = useParams();

	const [state, setState] = useState<State>({ security: null!, securityStats: null! });

	useEffect(() => {
		if (!securityId) {
			return;
		}

		const initData = async () => {
			const security = await getSecurityById(securityId);
			const securityStats = await getSecurityStats(securityId);
			if (!security || !securityStats) {
				return;
			}

			setState((currentState) => {
				return { ...currentState, security, securityStats };
			});
		};

		initData();
	}, [securityId]);

	if (!securityId || !state.security) {
		return <Fragment/>;
	}

	const { ticker, actualPrice, currency } = state.security;

	const tabItems: ResponsiveTabItem[] = [
		{
			value: "history",
			label: t("security_page_tabs_history"),
			icon: MdHistory
		},
		{
			value: "transactions",
			label: t("security_page_tabs_transactions"),
			icon: GrTransaction
		},
		{
			value: "dividends",
			label: t("security_page_tabs_dividends"),
			icon: PiCoinsLight
		}
	];

	return <Stack color="text_primary" gap={4}>
		<SecurityHeader security={state.security} securityStats={state.securityStats} />

  		<Tabs.Root lazyMount={true} unmountOnExit={true} variant="enclosed" defaultValue="history">
			<ResponsiveTabsList items={tabItems} breakpoint="md" />
			<Tabs.Content value="history">
				<SecurityHistory ticker={ticker} currencyName={currency.name} />
			</Tabs.Content>
			<Tabs.Content value="transactions">
				<SecurityTransactionsChart currentPrice={actualPrice} securityId={securityId} currencyName={currency.name}/>
			</Tabs.Content>
			<Tabs.Content value="dividends">
				<DividendList securityId={securityId} currencyName={currency.name}/>
			</Tabs.Content>
		</Tabs.Root>
	</Stack>;
};

export default SecurityPage;