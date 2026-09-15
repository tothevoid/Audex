import React from 'react';
import { Box, Button, Card, Flex, HStack, Icon, Link, Stack, Text } from '@chakra-ui/react';
import { MdDelete, MdEdit } from "react-icons/md";
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { getIconUrl } from '../../../../api/securities/securityApi';
import { SecurityEntity } from '../../../../models/securities/SecurityEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import StoredIcon from '../../../../shared/components/StoredIcon';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';

type Props = {
    security: SecurityEntity;
    onEditClicked: (security: SecurityEntity) => void;
    onDeleteClicked: (security: SecurityEntity) => void;
};

const Security: React.FC<Props> = ({ security, onEditClicked, onDeleteClicked }) => {
    const { id, name, ticker, type, actualPrice, currency, iconKey } = security;

    const securityLink = `../security/${id}`;
    const iconUrl = iconKey ? getIconUrl(iconKey) : undefined;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderWidth="1px"
            borderRadius="xl"
            overflow="hidden"
            position="relative"
            h="full"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            transition="all 0.2s ease-in-out"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg", borderColor: "rgba(255, 255, 255, 0.18)" }}
        >
            <Card.Body p={4} color="text_primary" flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                <Stack gap={3}>
                    <Flex justify="space-between" align="center" gap={2}>
                        <HStack gap={3} align="center" minW={0} flex="1">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<HiOutlineBuildingOffice2 size={24} color="#aaa" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Link
                                    href={securityLink}
                                    color="text_primary"
                                    fontWeight="700"
                                    fontSize="lg"
                                    letterSpacing="tight"
                                    truncate
                                    title={ticker}
                                    _hover={{ color: "status_success" }}
                                >
                                    {ticker}
                                </Link>
                                <Text
                                    fontSize="xs"
                                    color="text_secondary"
                                    fontWeight="500"
                                    truncate
                                    title={name}
                                >
                                    {name}
                                </Text>
                            </Stack>
                        </HStack>

                        <HStack gap={1} flexShrink={0}>
                            <Button
                                size="xs"
                                variant="subtle"
                                bg="button_background_secondary"
                                borderColor="border_primary"
                                borderWidth="1px"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditClicked(security);
                                }}
                            >
                                <Icon color="card_action_icon_primary" size="sm">
                                    <MdEdit />
                                </Icon>
                            </Button>
                            <Button
                                size="xs"
                                variant="subtle"
                                bg="button_background_secondary"
                                borderColor="border_primary"
                                borderWidth="1px"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteClicked(security);
                                }}
                            >
                                <Icon color="card_action_icon_danger" size="sm">
                                    <MdDelete />
                                </Icon>
                            </Button>
                        </HStack>
                    </Flex>
                </Stack>

                <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                    {type?.name ? (
                        <AccentBadge variant="success">
                            {type.name}
                        </AccentBadge>
                    ) : <Box />}
                    <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                        {formatMoneyByCurrencyCulture(actualPrice, currency?.name)}
                    </Text>
                </Flex>
            </Card.Body>
        </Card.Root>
    );
};

export default Security;