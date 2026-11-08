import React, { useRef, useState } from 'react';
import { Popover } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '@/features/UserProfileSettingsModal/hooks/UserProfileContext';
import { logout } from '@/api/auth/authApi';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import UserProfileSettingsModal from '@/features/UserProfileSettingsModal/UserProfileSettingsModal';
import ChangePasswordModal from '@/features/ChangePasswordModal/ChangePasswordModal';
import TokensModal from '@/features/TokensModal/TokensModal';
import { HeaderProfileButton } from './HeaderProfileButton';
import { HeaderProfileCard } from './HeaderProfileCard';

export const HeaderProfileMenu: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const [open, setOpen] = useState(false);
    const userProfileSettingsRef = useRef<BaseModalRef>(null);
    const changePasswordModalRef = useRef<BaseModalRef>(null);
    const tokensModalRef = useRef<BaseModalRef>(null);

    const handleOpenSettings = () => {
        setOpen(false);
        userProfileSettingsRef.current?.openModal();
    };

    const handleOpenChangePassword = () => {
        setOpen(false);
        changePasswordModalRef.current?.openModal();
    };

    const handleOpenTokens = () => {
        setOpen(false);
        tokensModalRef.current?.openModal();
    };

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        window.location.reload();
    };

    const userName = user?.userName || t('header_profile_user');
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <>
            <Popover.Root open={open} onOpenChange={(eventDetails) => setOpen(eventDetails.open)} positioning={{ placement: 'bottom-end' }}>
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
            <UserProfileSettingsModal ref={userProfileSettingsRef} />
            <ChangePasswordModal ref={changePasswordModalRef} />
            <TokensModal ref={tokensModalRef} />
        </>
    );
};
