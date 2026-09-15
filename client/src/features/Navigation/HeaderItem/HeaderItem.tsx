import { Flex, Icon, Text } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';
import './HeaderItem.scss';

type Props = {
    title: string;
    active: boolean;
    hasDropdown?: boolean;
    isOpen?: boolean;
};

const HeaderItem = (props: Props) => {
    const { title, active, hasDropdown, isOpen } = props;

    const additionalConfig = active ? {
        background: "background_primary",
        borderRadius: "10px"
    } : {};

    return (
        <Flex
            align="center"
            gap={1.5}
            color="text_primary"
            className="header-item"
            {...additionalConfig}
        >
            <Text as="span">{title}</Text>
            {hasDropdown && (
                <Icon
                    as={LuChevronDown}
                    boxSize="16px"
                    transition="transform 0.2s ease"
                    transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                    color={active ? 'action_primary' : 'text_primary'}
                />
            )}
        </Flex>
    );
};

export default HeaderItem;