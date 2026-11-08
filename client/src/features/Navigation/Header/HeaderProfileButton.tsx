import React from 'react';
import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdPerson } from 'react-icons/md';

interface HeaderProfileButtonProps {
    userName: string;
    userInitial: string;
    isOpen: boolean;
}

export const HeaderProfileButton = React.forwardRef<HTMLButtonElement, HeaderProfileButtonProps>(
    ({ userName, userInitial, isOpen, ...props }, ref) => (
        <Button
            ref={ref}
            size="md"
            borderRadius="full"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            px={{ base: 2, xl: 2.5 }}
            py={1.5}
            height="38px"
            display="flex"
            alignItems="center"
            gap={{ base: 1.5, xl: 2 }}
            cursor="pointer"
            flexShrink={0}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
                backgroundColor: 'background_primary',
                borderColor: 'action_primary'
            }}
            {...props}
        >
            <Flex
                w="26px"
                h="26px"
                borderRadius="full"
                backgroundColor="action_primary"
                color="white"
                align="center"
                justify="center"
                fontSize="xs"
                fontWeight="bold"
                flexShrink={0}
            >
                {userInitial || <Icon><MdPerson /></Icon>}
            </Flex>

            <Text
                fontSize="sm"
                fontWeight="medium"
                color="text_primary"
                maxW={{ base: "80px", xl: "110px" }}
                truncate
                display={{ base: "none", xl: "inline-block" }}
            >
                {userName}
            </Text>

            <Icon
                fontSize="16px"
                color="text_secondary"
                transition="transform 0.2s ease"
                transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                flexShrink={0}
            >
                <MdKeyboardArrowDown />
            </Icon>
        </Button>
    )
);

HeaderProfileButton.displayName = 'HeaderProfileButton';
