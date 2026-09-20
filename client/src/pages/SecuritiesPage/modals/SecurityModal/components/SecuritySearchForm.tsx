import { Box, Button, HStack, Input, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BsSearch } from "react-icons/bs";
import { searchMarketSecurity } from "../../../../../api/securities/securityApi";
import { MarketSecurityInfoEntity } from "../../../../../models/securities/SecurityEntity";

interface SecuritySearchFormProps {
    onFound: (marketInfo: MarketSecurityInfoEntity) => void;
    onManual: (query?: string) => void;
    onCancel: () => void;
}

const SecuritySearchForm: React.FC<SecuritySearchFormProps> = ({
    onFound,
    onManual,
    onCancel
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            const marketInfo = await searchMarketSecurity(query);
            if (!marketInfo) {
                setSearchError(t("entity_security_not_found_on_moex"));
                return;
            }

            onFound(marketInfo);
        } catch {
            setSearchError(t("entity_security_not_found_on_moex"));
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Stack gap={4} py={2}>
            <Text fontSize="sm" color="text_secondary">
                {t("entity_security_search_prompt")}
            </Text>

            <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                    }
                }}
                placeholder={t("entity_security_search_placeholder")}
                backgroundColor="background_secondary"
                borderColor="border_primary"
                color="text_primary"
            />

            {searchError && (
                <Box p={3} borderRadius="md" backgroundColor="pnl_negative_bg" borderColor="border_primary" borderWidth="1px">
                    <Text color="status_danger" fontSize="sm">
                        {searchError}
                    </Text>
                </Box>
            )}

            <HStack justify="flex-end">
                <Button
                    variant="ghost"
                    size="xs"
                    color="text_secondary"
                    onClick={() => onManual(searchQuery)}
                >
                    {t("entity_security_fill_manually_button")}
                </Button>
            </HStack>

            <HStack justify="flex-end" w="full" gap={3} pt={2}>
                <Button onClick={onCancel} variant="outline">
                    {t("modals_cancel_button")}
                </Button>
                <Button
                    colorPalette="blue"
                    onClick={handleSearch}
                    loading={isSearching}
                    disabled={!searchQuery.trim()}
                >
                    <BsSearch />
                    {t("entity_security_search_button")}
                </Button>
            </HStack>
        </Stack>
    );
};

export default SecuritySearchForm;
