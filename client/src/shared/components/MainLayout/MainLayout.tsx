import React, { useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
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
			<Flex direction="column" minH="100vh" boxSizing="border-box">
				<Box
					as="header"
					position="sticky"
					top={0}
					zIndex={1000}
					backgroundColor="header_bg"
					pt="env(safe-area-inset-top, 0px)"
					pl="env(safe-area-inset-left, 0px)"
					pr="env(safe-area-inset-right, 0px)"
				>
					<Header />
				</Box>
				<Box
					as="main"
					flex="1"
					w="100%"
					maxW="1560px"
					mx="auto"
					px={{ base: "16px", lg: "24px" }}
					pt={{ base: "16px", lg: "24px" }}
					pb={{
						base: "calc(24px + env(safe-area-inset-bottom, 0px))",
						lg: "calc(32px + env(safe-area-inset-bottom, 0px))"
					}}
					boxSizing="border-box"
				>
					<Outlet />
				</Box>
			</Flex>
		</UserProvider>
	);
};

export default MainLayout;
