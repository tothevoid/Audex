import React from 'react';
import { Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdSecurity } from 'react-icons/md';

export const TokensHeader: React.FC = () => {
    const { t } = useTranslation();

    return (
        <HStack gap={2.5} align="center">
            <Flex
                w="32px"
                h="32px"
                borderRadius="lg"
                backgroundColor="status_success_bg"
                color="status_success"
                align="center"
                justify="center"
                fontSize="18px"
            >
                <MdSecurity />
            </Flex>
            <Text color="text_primary" fontSize="md" fontWeight="bold">
                {t('tokens_modal_title')}
            </Text>
        </HStack>
    );
};
