import React from 'react';
import { Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { MdChevronRight } from 'react-icons/md';

interface HeaderProfileMenuItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isDanger?: boolean;
}

export const HeaderProfileMenuItem: React.FC<HeaderProfileMenuItemProps> = ({
    icon,
    title,
    description,
    onClick,
    isDanger = false
}) => (
    <Flex
        as="button"
        align="center"
        justify="space-between"
        w="100%"
        textAlign="left"
        p={2.5}
        borderRadius="xl"
        cursor="pointer"
        border="none"
        backgroundColor="transparent"
        transition="all 0.15s ease"
        _hover={{
            backgroundColor: isDanger ? 'status_danger_bg' : 'background_primary',
            transform: 'translateX(3px)'
        }}
        onClick={onClick}
    >
        <HStack gap={3} flex={1} align="center" textAlign="left">
            <Flex
                w="36px"
                h="36px"
                minW="36px"
                borderRadius="lg"
                backgroundColor={isDanger ? 'status_danger_bg' : 'background_primary'}
                color={isDanger ? 'status_danger' : 'card_action_icon_primary'}
                align="center"
                justify="center"
                fontSize="18px"
                border="1px solid"
                borderColor={isDanger ? 'status_danger_border' : 'border_primary'}
                flexShrink={0}
            >
                {icon}
            </Flex>
            <VStack align="start" gap={0} flex={1} textAlign="left">
                <Text fontSize="sm" fontWeight="medium" color={isDanger ? 'status_danger' : 'text_primary'} textAlign="left">
                    {title}
                </Text>
                <Text fontSize="xs" color="text_secondary" textAlign="left">
                    {description}
                </Text>
            </VStack>
        </HStack>
        <Icon fontSize="18px" color={isDanger ? 'status_danger' : 'text_secondary'} flexShrink={0}>
            <MdChevronRight />
        </Icon>
    </Flex>
);
