import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/features/Navigation/Header/Header';
import { UserProvider } from '@/features/UserProfileSettingsModal/hooks/UserProvider';
import { useServerToasts } from '@/shared/hooks/useServerToasts';
import { signalRService } from '@/shared/services/signalRService';

export const MainLayout: React.FC = () => {
	useServerToasts();

	useEffect(() => {
		const initializeConnection = async () => {
			await signalRService.startAsync();
		};

		initializeConnection();

		return () => {
			const closeConnection = async () => {
				await signalRService.stopAsync();
			};

			closeConnection();
		};
	}, []);

	return (
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
};

export default MainLayout;
