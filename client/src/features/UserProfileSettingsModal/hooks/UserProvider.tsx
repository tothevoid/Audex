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
			changeLanguage(userProfile.language.code);
		};
		fetchUser();
	}, []);

	const updateUser = useCallback((updatedUser: UserProfileEntity) => {
		const isLanguageChanged = user?.language.code !== updatedUser.language.code;
		setUser(updatedUser);
		if (isLanguageChanged) {
			changeLanguage(updatedUser.language.code);
			localStorage.setItem("lang", updatedUser.language.code);
		}
	}, [user?.language.code]);

	return (
		<UserContext.Provider value={{ user, updateUser }}>
			{children}
		</UserContext.Provider>
	);
};
