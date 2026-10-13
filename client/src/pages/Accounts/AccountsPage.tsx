import { useCallback, useEffect, useState } from "react";
import { getSummary } from "@/api/accounts/accountApi";
import { AccountCurrencySummary } from "@/models/accounts/accountsSummary";
import PageContainer from "@/shared/components/PageContainer/PageContainer";
import AccountsList from "./components/AccountsList/AccountsList";

const AccountsPage: React.FC = () => {
	const [accountCurrencySummaries, setAccountCurrencySummaries] = useState<AccountCurrencySummary[]>([]);
	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const onAccountsChanged = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			const summaries = await getSummary();
			if (isMounted) {
				setAccountCurrencySummaries(summaries);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [refreshTrigger]);

	return (
		<PageContainer>
			<AccountsList
				accountCurrencySummaries={accountCurrencySummaries}
				onAccountsChanged={onAccountsChanged}
			/>
		</PageContainer>
	);
};

export default AccountsPage;