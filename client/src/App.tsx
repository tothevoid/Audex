import './App.scss';
import Header from './features/Navigation/Header/Header';
import TransactionsPage from './pages/Transactions/TransactionsPage'
import DepositsPage from './pages/Deposits/DepositsPage';

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate, useLocation } from 'react-router-dom';
import AccountsPage from './pages/Accounts/AccountsPage';
import DataPage from './pages/Data/DataPage';
import BrokerAccountsPage from './pages/BrokerAccounts/BrokerAccountsPage';
import SecuritiesPage from './pages/SecuritiesPage/SecuritiesPage';
import BrokerAccountPage from './pages/BrokerAccount/BrokerAccountPage';
import SecurityPage from './pages/SecurityPage/SecurityPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DebtsPage from './pages/Debts/DebtsPage';
import CryptocurrenciesPage from './pages/CryptocurrenciesPage/CryptocurrenciesPage';
import CryptoAccountsPage from './pages/CryptoAccountsPage/CryptoAccountsPage';
import CryptoAccountPage from './pages/CryptoAccountPage/CryptoAccountPage';
import AuthPage from './pages/Auth/AuthPage';
import { UserProvider } from './features/UserProfileSettingsModal/hooks/UserProfileContext';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import CashAccountPage from './pages/CashAccountPage/CashAccountPage.tsx';
import SchedulerPage from './pages/Scheduler/SchedulerPage.tsx';
import { getAccessToken } from './api/tokenStorage';
import { refreshToken } from './api/auth/authApi';

const RequireAuth = () => {
	const token = getAccessToken();
	const [checkingAuth, setCheckingAuth] = useState<boolean>(!token);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
	const location = useLocation();

	useEffect(() => {
		const currentToken = getAccessToken();

		if (currentToken) {
			setIsAuthenticated(true);
			setCheckingAuth(false);
			return;
		}

		refreshToken()
			.then(refreshedToken => {
				setIsAuthenticated(!!refreshedToken);
			})
			.catch(() => {
				setIsAuthenticated(false);
			})
			.finally(() => {
				setCheckingAuth(false);
			});
	}, []);

	if (checkingAuth) {
		return null;
	}

	return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
}

const PageWrapper = () => (
	<UserProvider>
		<div className="app">
			<div className="header">
				<Header />
			</div>
			<main className="app-main">
				<Outlet />
			</main>
		</div>
	</UserProvider>
);

const App = () => {
	return (
		<Router>
			<Routes>
				<Route path="/auth" element={<AuthPage />} />
				<Route element={<RequireAuth />}>
					<Route element={<PageWrapper />}>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/accounts" element={<AccountsPage />} />
						<Route path="/transactions" element={<TransactionsPage />} />
						<Route path="/deposits" element={<DepositsPage />} />
						<Route path="/broker_accounts" element={<BrokerAccountsPage />} />
						<Route path="/securities" element={<SecuritiesPage />} />
						<Route path="/debts" element={<DebtsPage />} />
						<Route path="/cryptocurrencies" element={<CryptocurrenciesPage />} />
						<Route path="/crypto_accounts" element={<CryptoAccountsPage />} />
						<Route path="/crypto_account/:cryptoAccountId" element={<CryptoAccountPage />} />
						<Route path="/data" element={<DataPage />} />
						<Route path="/data/:tab" element={<DataPage />} />
						<Route path="/broker_account/:brokerAccountId" element={<BrokerAccountPage />} />
						<Route path="/security/:securityId" element={<SecurityPage />} />
						<Route path="/cash_account/:cashAccountId" element={<CashAccountPage />} />
						<Route path="/notifications" element={<NotificationsPage />} />
						<Route path="/scheduler" element={<SchedulerPage />} />
					</Route>
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
