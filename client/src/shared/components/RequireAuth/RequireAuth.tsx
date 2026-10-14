import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken } from '@/api/tokenStorage';
import { refreshToken } from '@/api/auth/authApi';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export const RequireAuth: React.FC = () => {
	const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
		getAccessToken() ? 'authenticated' : 'checking'
	);
	const location = useLocation();

	useEffect(() => {
		if (authStatus !== 'checking') {
			return;
		}

		let isMounted = true;
		refreshToken()
			.then(refreshedToken => {
				if (isMounted) {
					setAuthStatus(refreshedToken ?
						'authenticated' :
						'unauthenticated');
				}
			})
			.catch(() => {
				if (isMounted) {
					setAuthStatus('unauthenticated');
				}
			});

		return () => {
			isMounted = false;
		};
	}, [authStatus]);

	if (authStatus === 'checking') {
		return null;
	}

	return authStatus === 'authenticated' ? (
		<Outlet />
	) : (
		<Navigate to="/auth" replace state={{ from: location.pathname }} />
	);
};

export default RequireAuth;
