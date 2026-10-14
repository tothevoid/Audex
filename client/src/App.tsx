import '@/App.scss';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, Theme } from '@chakra-ui/react';
import { useColorMode } from '@/shared/context/useColorMode';
import { Toaster } from '@/shared/components/Toaster';
import RequireAuth from '@/shared/components/RequireAuth/RequireAuth';
import MainLayout from '@/shared/components/MainLayout/MainLayout';

import AuthPage from '@/pages/Auth/AuthPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import AccountsPage from '@/pages/Accounts/AccountsPage';
import TransactionsPage from '@/pages/Transactions/TransactionsPage';
import DepositsPage from '@/pages/Deposits/DepositsPage';
import BrokerAccountsPage from '@/pages/BrokerAccounts/BrokerAccountsPage';
import SecuritiesPage from '@/pages/SecuritiesPage/SecuritiesPage';
import BrokerAccountPage from '@/pages/BrokerAccount/BrokerAccountPage';
import SecurityPage from '@/pages/SecurityPage/SecurityPage';
import DebtsPage from '@/pages/Debts/DebtsPage';
import CryptocurrenciesPage from '@/pages/CryptocurrenciesPage/CryptocurrenciesPage';
import CryptoAccountsPage from '@/pages/CryptoAccountsPage/CryptoAccountsPage';
import CryptoAccountPage from '@/pages/CryptoAccountPage/CryptoAccountPage';
import CashAccountPage from '@/pages/CashAccountPage/CashAccountPage';
import DataPage from '@/pages/Data/DataPage';
import NotificationsPage from '@/pages/Notifications/NotificationsPage';
import SchedulerPage from '@/pages/Scheduler/SchedulerPage';

export const App: React.FC = () => {
	const { resolvedColorMode } = useColorMode();

	return (
		<Theme appearance={resolvedColorMode} hasBackground={false}>
			<Box backgroundColor="background_main" minH="100vh">
				<Router>
					<Routes>
						<Route path="/auth" element={<AuthPage />} />
						<Route element={<RequireAuth />}>
							<Route element={<MainLayout />}>
								<Route path="/" element={<DashboardPage />} />
								<Route path="/dashboard" element={<Navigate to="/" replace />} />
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
				<Toaster />
			</Box>
		</Theme>
	);
};

export default App;
