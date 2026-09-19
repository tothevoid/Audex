import { useCallback, useEffect, useState } from "react";
import { getSummary } from "../../api/accounts/accountApi";
import { AccountCurrencySummary } from "../../models/accounts/accountsSummary";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import AccountsList from "./components/AccountsList/AccountsList";

const AccountsPage: React.FC = () => {
	const [accountCurrencySummaries, setAccountCurrencySummaries] = useState<AccountCurrencySummary[]>([]);

	const requestAccountsData = useCallback(async () => {
		const summaries = await getSummary();
		setAccountCurrencySummaries(summaries);
	}, []);

	const onAccountsChanged = useCallback(async () => {
		await requestAccountsData();
	}, [requestAccountsData]);

	useEffect(() => {
		requestAccountsData();
	}, [requestAccountsData]);

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