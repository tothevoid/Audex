import React from "react";
import { Card, Flex } from "@chakra-ui/react";
import { AccountCurrencySummary } from "../../../../models/accounts/accountsSummary";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import { useTranslation } from "react-i18next";
import { getCurrencyColor, getCurrencyIcon } from "../../../../shared/utilities/currencyUtils";
import { useColorMode } from "../../../../shared/context/ColorModeContext";

interface Props {
	accountCurrencySummaries: AccountCurrencySummary[];
}

const AccountsTotal: React.FC<Props> = ({ accountCurrencySummaries }) => {
	const { i18n } = useTranslation();
	const { resolvedColorMode } = useColorMode();

	if (!accountCurrencySummaries.length) {
		return null;
	}

	return (
		<Card.Root backgroundColor="background_primary" borderColor="border_primary" mb={4}>
			<Card.Body p={4}>
				<Flex
					justifyContent="flex-start"
					alignItems="center"
					flexWrap="wrap"
					gap={{ base: 4, md: 8 }}
				>
					{accountCurrencySummaries.map((currencySummary) => {
						const { iconBg, iconColor } = getCurrencyColor(currencySummary.name, resolvedColorMode);
						const icon = getCurrencyIcon(currencySummary.name, i18n.language);

						return (
							<NumericMetricItem
								key={currencySummary.name}
								icon={icon}
								iconBg={iconBg}
								iconColor={iconColor}
								label={currencySummary.name}
								value={currencySummary.summary}
								currency={currencySummary.name}
							/>
						);
					})}
				</Flex>
			</Card.Body>
		</Card.Root>
	);
};

export default AccountsTotal;
