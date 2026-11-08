import { Flex, Icon, Text } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';

type Props = {
    title: string;
    active: boolean;
    hasDropdown?: boolean;
    isOpen?: boolean;
};

const HeaderItem = ({ title, active, hasDropdown, isOpen }: Props) => {
    return (
        <Flex
            align="center"
            gap={1}
            color="text_primary"
            height="100%"
            fontWeight="semibold"
            whiteSpace="nowrap"
            px={{ base: "0.45rem", xl: "0.95rem" }}
            py={{ base: "0.4rem", xl: "0.75rem" }}
            fontSize={{ base: "0.84rem", xl: "0.95rem" }}
            borderRadius={{ base: "6px", xl: "10px" }}
            backgroundColor={active ? "background_primary" : "transparent"}
            transition="background-color 0.15s ease, color 0.15s ease"
            cursor="pointer"
        >
            <Text as="span">{title}</Text>
            {hasDropdown && (
                <Icon
                    as={LuChevronDown}
                    boxSize="14px"
                    transition="transform 0.2s ease"
                    transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                    color={active ? 'action_primary' : 'text_primary'}
                    flexShrink={0}
                />
            )}
        </Flex>
    );
};

export default HeaderItem;
