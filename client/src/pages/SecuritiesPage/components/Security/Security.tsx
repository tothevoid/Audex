import React from 'react';
import { Card, Flex, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { getIconUrl } from '../../../../api/securities/securityApi';
import { SecurityEntity } from '../../../../models/securities/SecurityEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import StoredIcon from '../../../../shared/components/StoredIcon';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

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
        <EntityCard h="full" display="flex" flexDirection="column" justifyContent="space-between">
            <Card.Body p={4} color="text_primary" flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                <Stack gap={3}>
                    <Flex justify="space-between" align="center" gap={2}>
                        <HStack gap={3} align="center" minW={0} flex="1">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<HiOutlineBuildingOffice2 size={24} color="var(--chakra-colors-text_secondary)" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Link
                                    asChild
                                    color="text_primary"
                                    fontWeight="700"
                                    fontSize="lg"
                                    letterSpacing="tight"
                                    truncate
                                    title={ticker}
                                    _hover={{ color: "status_success" }}
                                >
                                    <NavLink to={securityLink}>{ticker}</NavLink>
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

                        <CardActionButtons
                            onEdit={() => onEditClicked(security)}
                            onDelete={() => onDeleteClicked(security)}
                        />
                    </Flex>
                </Stack>

                <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                    {type?.name ? (
                        <AccentBadge variant="success">
                            {type.name}
                        </AccentBadge>
                    ) : <span />}
                    <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                        {formatMoneyByCurrencyCulture(actualPrice, currency?.name)}
                    </Text>
                </Flex>
            </Card.Body>
        </EntityCard>
    );
};

export default Security;