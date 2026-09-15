import { useCallback, useState } from "react";
import { getSummary } from "../../api/accounts/accountApi";
import { AccountCurrencySummary } from "../../models/accounts/accountsSummary";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import AccountsList from "./components/AccountsList/AccountsList";
import AccountsTotal from "./components/AccountsTotal/AccountsTotal";

const AccountsPage: React.FC = () => {

	const [accountCurrencySummaries, setAccountCurrencySummaries] = useState<AccountCurrencySummary[]>([]);
	const requestAccountsData = async () => {
		const accountCurrencySummaries = await getSummary();
		setAccountCurrencySummaries(accountCurrencySummaries)
	};

	const onAccountsChanged = useCallback(async () => {
		await requestAccountsData();
	}, []);

	return <PageContainer>
		<AccountsTotal accountCurrencySummaries={accountCurrencySummaries} />
		<AccountsList onAccountsChanged={onAccountsChanged}/>
	</PageContainer>
}

export default AccountsPage;