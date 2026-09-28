import { createContext, useContext } from 'react';
import { UserProfileEntity } from '@/models/user/UserProfileEntity';

export type UserContextType = {
	user: UserProfileEntity | null;
	updateUser: (updatedUser: UserProfileEntity) => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserProfile = () => {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error('useUserProfile must be used within a UserProvider');
	}
	return context;
};
