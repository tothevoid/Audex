import React, { useState } from 'react';
import { Popover } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '../../UserProfileSettingsModal/hooks/UserProfileContext';
import { logout } from '../../../api/auth/authApi';
import { HeaderProfileButton } from './HeaderProfileButton';
import { HeaderProfileCard } from './HeaderProfileCard';

interface HeaderProfileMenuProps {
    onOpenSettings: () => void;
    onOpenChangePassword: () => void;
    onOpenTokens: () => void;
}

export const HeaderProfileMenu: React.FC<HeaderProfileMenuProps> = ({
    onOpenSettings,
    onOpenChangePassword,
    onOpenTokens
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const [open, setOpen] = useState(false);

    const handleOpenSettings = () => {
        setOpen(false);
        onOpenSettings();
    };

    const handleOpenChangePassword = () => {
        setOpen(false);
        onOpenChangePassword();
    };

    const handleOpenTokens = () => {
        setOpen(false);
        onOpenTokens();
    };

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        window.location.reload();
    };

    const userName = user?.userName || t('header_profile_user');
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <Popover.Root open={open} onOpenChange={e => setOpen(e.open)} positioning={{ placement: 'bottom-end' }}>
            <Popover.Trigger asChild>
                <HeaderProfileButton
                    userName={userName}
                    userInitial={userInitial}
                    isOpen={open}
                />
            </Popover.Trigger>
            <HeaderProfileCard
                userName={userName}
                userInitial={userInitial}
                onOpenSettings={handleOpenSettings}
                onOpenChangePassword={handleOpenChangePassword}
                onOpenTokens={handleOpenTokens}
                onLogout={handleLogout}
            />
        </Popover.Root>
    );
};
