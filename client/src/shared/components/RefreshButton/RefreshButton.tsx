import React from "react";
import { HStack, Icon, Text } from "@chakra-ui/react";
import { MdRefresh } from "react-icons/md";
import { BsClockHistory } from "react-icons/bs";
import "./RefreshButton.scss";

interface Props {
    title?: string;
    isRefreshing: boolean;
    onClick: () => void;
    showClockIcon?: boolean;
    className?: string;
}

const RefreshButton: React.FC<Props> = ({
    title,
    isRefreshing,
    onClick,
    showClockIcon = false,
    className
}) => {
    return (
        <HStack
            as="button"
            className={className}
            onClick={isRefreshing ? undefined : onClick}
            px={3}
            py={1.5}
            borderRadius="md"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            color="text_secondary"
            cursor={isRefreshing ? "not-allowed" : "pointer"}
            opacity={isRefreshing ? 0.6 : 1}
            transition="all 0.2s ease"
            _hover={isRefreshing ? {} : {
                backgroundColor: "background_primary",
                borderColor: "action_primary",
                "& .refresh-icon": { transform: "rotate(180deg)" }
            }}
            alignItems="center"
            gap={2}
        >
            {showClockIcon && (
                <Icon color="text_secondary">
                    <BsClockHistory size={13} />
                </Icon>
            )}
            {title && (
                <Text fontSize="xs" fontWeight={500} color="text_secondary">
                    {title}
                </Text>
            )}
            <Icon
                className="refresh-icon"
                transition="transform 0.3s ease"
                animation={isRefreshing ? "loading-spin 1.5s linear infinite" : "none"}
                color="action_primary"
            >
                <MdRefresh size={16} />
            </Icon>
        </HStack>
    );
};

export default RefreshButton;