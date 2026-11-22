import React, { useState, useCallback, useEffect } from 'react';
import { Button, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { UserProfileEntity } from '@/models/user/UserProfileEntity';
import { getUserProfile } from '@/api/user/userProfileApi';
import { AppLoader } from '@/shared/components/AppLoader';
import i18n from '@/i18n';
import { UserContext } from './UserProfileContext';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useTranslation();
	const [user, setUser] = useState<UserProfileEntity | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [hasError, setHasError] = useState<boolean>(false);

	const updateUser = useCallback((updatedUser: UserProfileEntity) => {
		setUser(updatedUser);
		if (i18n.language !== updatedUser.language.code) {
			i18n.changeLanguage(updatedUser.language.code);
			localStorage.setItem('lang', updatedUser.language.code);
		}
	}, []);

	const handleRetry = useCallback(async () => {
		setIsLoading(true);
		setHasError(false);

		try {
			const userProfile = await getUserProfile();
			if (!userProfile) {
				setHasError(true);
				return;
			}
			updateUser(userProfile);
		} catch {
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}, [updateUser]);

	useEffect(() => {
		let isMounted = true;

		getUserProfile()
			.then((userProfile) => {
				if (!isMounted) return;
				if (!userProfile) {
					setHasError(true);
					return;
				}
				updateUser(userProfile);
			})
			.catch(() => {
				if (isMounted) {
					setHasError(true);
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [updateUser]);

	if (isLoading) {
		return <AppLoader />;
	}

	if (hasError || !user) {
		return (
			<Flex
				minH="100vh"
				align="center"
				justify="center"
				backgroundColor="background_main"
				p={4}
			>
				<VStack gap={4} textAlign="center" maxW="400px">
					<Text fontSize="lg" fontWeight={700} color="text_primary">
						{t('user_profile_load_error_title')}
					</Text>
					<Text fontSize="sm" color="text_secondary">
						{t('user_profile_load_error_desc')}
					</Text>
					<Button
						variant="solid"
						onClick={handleRetry}
						borderRadius="lg"
					>
						<Icon mr={1}>
							<MdRefresh size={18} />
						</Icon>
						{t('user_profile_load_retry')}
					</Button>
				</VStack>
			</Flex>
		);
	}

	return (
		<UserContext.Provider value={{ user, updateUser }}>
			{children}
		</UserContext.Provider>
	);
};
