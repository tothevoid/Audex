import { Box } from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import BaseModal from '@/shared/modals/BaseModal/BaseModal';
import {
    getPagedRefreshTokens,
    RefreshTokensQuery,
    revokeOtherTokens,
    revokeToken
} from '@/api/auth/tokensApi';
import CollectionPagination from '@/shared/components/CollectionPagination/CollectionPagination';
import { TokensHeader } from './components/TokensHeader';
import { TokensTabs } from './components/TokensTabs';
import { TokensList } from './components/TokensList';
import { TokensFooter } from './components/TokensFooter';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { UserRefreshTokenEntity } from '@/models/auth/UserRefreshTokenEntity';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const TokensModal = forwardRef<BaseModalRef>((_, ref) => {
    const modalRef = useRef<BaseModalRef>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isOnlyActive, setIsOnlyActive] = useState(true);
    const [isRevokingAll, setIsRevokingAll] = useState(false);

    const filters = useMemo(() => ({
        isOnlyActive
    }), [isOnlyActive]);

    const {
        items: tokens,
        totalCount,
        pageIndex: currentPage,
        pageSize,
        isLoading: loading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<UserRefreshTokenEntity, RefreshTokensQuery>({
        fetchData: getPagedRefreshTokens,
        filters,
        initialPageSize: 5,
        autoLoad: isOpen
    });

    useImperativeHandle(ref, () => ({
        openModal: () => {
            setIsOnlyActive(true);
            setIsOpen(true);
            reset();
            modalRef.current?.openModal();
        },
        closeModal: () => {
            modalRef.current?.closeModal();
        }
    }));

    const handleRevokeSingle = async (tokenId: string) => {
        const isSuccess = await revokeToken(tokenId);
        if (isSuccess) {
            await refreshPage();
        }
    };

    const handleRevokeAllOthers = async () => {
        setIsRevokingAll(true);
        try {
            const isSuccess = await revokeOtherTokens();
            if (isSuccess) {
                await reset();
            }
        } finally {
            setIsRevokingAll(false);
        }
    };

    const hasOtherActiveTokens =
        !loading && isOnlyActive && tokens.some((token) => !token.isCurrent);

    return (
        <BaseModal
            ref={modalRef}
            title={<TokensHeader />}
            maxW="600px"
            footer={
                <TokensFooter
                    hasOtherActiveTokens={hasOtherActiveTokens}
                    isRevokingAll={isRevokingAll}
                    onRevokeAllOthers={handleRevokeAllOthers}
                    onClose={() => modalRef.current?.closeModal()}
                />
            }
        >
            <TokensTabs isOnlyActive={isOnlyActive} onTabChange={setIsOnlyActive} />

            <TokensList
                tokens={tokens}
                loading={loading}
                isOnlyActive={isOnlyActive}
                onRevokeSingle={handleRevokeSingle}
            />

            <Box mt={3}>
                <CollectionPagination
                    count={totalCount}
                    page={currentPage}
                    pageSize={pageSize}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    showPageSizeSelector
                    showTotalCount
                    onPageChange={(nextPage, newPageSize) => loadPage(nextPage, newPageSize)}
                    size="sm"
                />
            </Box>
        </BaseModal>
    );
});

export default TokensModal;
