import { Box } from '@chakra-ui/react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { BaseModalRef } from '../../shared/utilities/modalUtilities';
import BaseModal from '../../shared/modals/BaseModal/BaseModal';
import { UserRefreshTokenEntity } from '../../models/auth/UserRefreshTokenEntity';
import {
    getRefreshTokens,
    getRefreshTokensPagination,
    revokeOtherTokens,
    revokeToken
} from '../../api/auth/tokensApi';
import CollectionPagination from '../../shared/components/CollectionPagination/CollectionPagination';
import { TokensHeader } from './components/TokensHeader';
import { TokensTabs, TokensTabType } from './components/TokensTabs';
import { TokensList } from './components/TokensList';
import { TokensFooter } from './components/TokensFooter';

const PAGE_SIZE = 5;

const TokensModal = forwardRef<BaseModalRef>((_, ref) => {
    const modalRef = useRef<BaseModalRef>(null);
    const [activeTab, setActiveTab] = useState<TokensTabType>('active');
    const [tokens, setTokens] = useState<UserRefreshTokenEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRevokingAll, setIsRevokingAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationKey, setPaginationKey] = useState(0);

    const loadData = useCallback(async (isActive: boolean, page: number) => {
        setLoading(true);
        try {
            const data = await getRefreshTokens(isActive, page, PAGE_SIZE);
            setTokens(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPaginationConfig = useCallback(async () => {
        return await getRefreshTokensPagination(activeTab === 'active');
    }, [activeTab]);

    useImperativeHandle(ref, () => ({
        openModal: () => {
            setActiveTab('active');
            setCurrentPage(1);
            setPaginationKey(k => k + 1);
            modalRef.current?.openModal();
        },
        closeModal: () => {
            modalRef.current?.closeModal();
        }
    }));

    const handleTabChange = (tab: TokensTabType) => {
        if (tab === activeTab) return;
        setTokens([]);
        setActiveTab(tab);
        setCurrentPage(1);
        setPaginationKey(k => k + 1);
    };

    const handlePageChanged = (_pageSize: number, page: number) => {
        const targetPage = page > 0 ? page : 1;
        setCurrentPage(targetPage);
        loadData(activeTab === 'active', targetPage);
    };

    const handleRevokeSingle = async (id: string) => {
        const success = await revokeToken(id);
        if (success) {
            await loadData(activeTab === 'active', currentPage);
            setPaginationKey(k => k + 1);
        }
    };

    const handleRevokeAllOthers = async () => {
        setIsRevokingAll(true);
        try {
            await revokeOtherTokens();
            setCurrentPage(1);
            await loadData(true, 1);
            setPaginationKey(k => k + 1);
        } finally {
            setIsRevokingAll(false);
        }
    };

    const hasOtherActiveTokens =
        !loading && activeTab === 'active' && tokens.some(token => !token.isCurrent);

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
            <TokensTabs activeTab={activeTab} onTabChange={handleTabChange} />

            <TokensList
                tokens={tokens}
                loading={loading}
                activeTab={activeTab}
                onRevokeSingle={handleRevokeSingle}
            />

            <Box minHeight="40px" display="flex" alignItems="center" justifyContent="center" mt={3}>
                <CollectionPagination
                    key={`${activeTab}-${paginationKey}`}
                    getPaginationConfig={fetchPaginationConfig}
                    onPageChanged={handlePageChanged}
                    size="sm"
                />
            </Box>
        </BaseModal>
    );
});

export default TokensModal;
