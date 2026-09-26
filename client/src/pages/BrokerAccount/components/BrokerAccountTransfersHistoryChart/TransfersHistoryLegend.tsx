import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { CHART_THEME_COLORS } from "../../../../shared/constants/chartColors";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { Nullable } from "../../../../shared/utilities/nullable";
import { AccountItem } from "./types";

interface Props {
    accountList: AccountItem[];
    hoveredAccountId: Nullable<string>;
    onHoverChanged: (accountId: Nullable<string>) => void;
    currencyName: string;
}

const TransfersHistoryLegend: React.FC<Props> = ({
    accountList,
    hoveredAccountId,
    onHoverChanged,
    currencyName
}) => {
    if (accountList.length === 0) return null;

    return (
        <Flex
            mt={4}
            pt={3}
            borderTop="1px solid"
            borderColor={CHART_THEME_COLORS.divider}
            wrap="wrap"
            gap={2}
            justifyContent="center"
        >
            {accountList.map((account) => {
                const isHovered = hoveredAccountId === account.id;
                return (
                    <Flex
                        key={account.id}
                        alignItems="center"
                        gap={2}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        bg={isHovered ? "rgba(255, 255, 255, 0.1)" : "background_secondary"}
                        border="1px solid"
                        borderColor={isHovered ? account.color : "border_primary"}
                        transition="all 0.15s ease-in-out"
                        cursor="pointer"
                        onMouseEnter={() => onHoverChanged(account.id)}
                        onMouseLeave={() => onHoverChanged(null)}
                    >
                        <Box
                            w={2.5}
                            h={2.5}
                            borderRadius="full"
                            bg={account.color}
                            boxShadow={`0 0 6px ${account.color}80`}
                            flexShrink={0}
                        />
                        <Text
                            fontSize="xs"
                            color="text_primary"
                            fontWeight="medium"
                            maxW="160px"
                            truncate
                        >
                            {account.name}
                        </Text>
                        {(account.deposited > 0 || account.withdrawn > 0) && (
                            <Text fontSize="2xs" color="text_secondary" fontWeight="semibold">
                                (+{formatMoneyByCurrencyCulture(account.deposited, currencyName, 0)} / -{formatMoneyByCurrencyCulture(account.withdrawn, currencyName, 0)})
                            </Text>
                        )}
                    </Flex>
                );
            })}
        </Flex>
    );
};

export default TransfersHistoryLegend;
