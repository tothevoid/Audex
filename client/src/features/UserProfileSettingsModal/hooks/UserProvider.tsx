import React, { useState, useCallback, useEffect } from 'react';
import { UserProfileEntity } from '@/models/user/UserProfileEntity';
import { getUserProfile } from '@/api/user/userProfileApi';
import { changeLanguage } from 'i18next';
import { UserContext } from './UserProfileContext';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<UserProfileEntity | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			const userProfile = await getUserProfile();
			if (!userProfile) return;

			setUser(userProfile);
			changeLanguage(userProfile.languageCode);
		};
		fetchUser();
	}, []);

	const updateUser = useCallback((updatedUser: UserProfileEntity) => {
		const isLanguageChanged = user?.languageCode !== updatedUser.languageCode;
		setUser(updatedUser);
		if (isLanguageChanged) {
			changeLanguage(updatedUser.languageCode);
			localStorage.setItem("lang", updatedUser.languageCode);
		}
	}, [user?.languageCode]);

	return (
		<UserContext.Provider value={{ user, updateUser }}>
			{children}
		</UserContext.Provider>
	);
};
