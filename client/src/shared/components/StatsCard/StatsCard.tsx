import { Box, Card, Flex, Text } from "@chakra-ui/react";
import React from "react";
import { Nullable } from "../../utilities/nullable";

export interface StatsCardProps {
    title: string;
    color?: Nullable<string>;
    value: number | string;
    icon?: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
    isHoverable?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    color,
    icon,
    iconBg = "background_secondary",
    iconColor = "text_secondary",
    isHoverable = false,
}) => {
    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            color="text_primary"
            borderRadius="lg"
            transition={isHoverable ? "transform 0.2s, box-shadow 0.2s" : undefined}
            _hover={isHoverable ? { transform: "translateY(-2px)", boxShadow: "sm" } : undefined}
        >
            {icon ? (
                <Card.Body p={4}>
                    <Flex align="center" justify="space-between">
                        <Box>
                            <Text fontSize="xs" fontWeight="500" color="text_secondary">
                                {title}
                            </Text>
                            <Text fontSize="xl" fontWeight={700} color={color || "text_primary"} mt={1}>
                                {value}
                            </Text>
                        </Box>
                        <Flex
                            w={10}
                            h={10}
                            borderRadius="full"
                            align="center"
                            justify="center"
                            bg={iconBg}
                            color={iconColor}
                            flexShrink={0}
                        >
                            {icon}
                        </Flex>
                    </Flex>
                </Card.Body>
            ) : (
                <>
                    <Card.Header>
                        {title}
                    </Card.Header>
                    <Card.Body fontSize="xl" fontWeight={700} color={color ? color : undefined}>
                        {value}
                    </Card.Body>
                </>
            )}
        </Card.Root>
    );
};

export default StatsCard;