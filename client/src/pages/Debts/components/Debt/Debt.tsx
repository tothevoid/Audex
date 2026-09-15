import { Button, Card, Flex, Stack, Text } from '@chakra-ui/react';
import { MdSettings } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { DebtEntity } from '../../../../models/debts/DebtEntity';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import DebtTagBadge from '../DebtTagBadge/DebtTagBadge';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';

type Props = {
	debt: DebtEntity,
	isSelected?: boolean,
	onSelect?: (debt: DebtEntity) => void,
	onEditClicked: (debt: DebtEntity) => void,
	onDeleteClicked: (debt: DebtEntity) => void,
	onManageTagsClicked: (debt: DebtEntity) => void,
}

const Debt = (props: Props) => {
	const { name, amount, date, currency, debtTags } = props.debt;
	const { i18n } = useTranslation();

	return (
		<Card.Root
			backgroundColor="background_primary"
			borderColor={props.isSelected ? "action_primary" : "border_primary"}
			borderWidth={props.isSelected ? "2px" : "1px"}
			cursor={props.onSelect ? "pointer" : "default"}
			onClick={() => props.onSelect && props.onSelect(props.debt)}
		>
			<Card.Body color="text_primary" boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
				<Flex justifyContent="space-between" alignItems="flex-start">
					<Stack gap={1}>
						<Text fontWeight={600} fontSize="lg">{name}</Text>
						<Text fontWeight={600} fontSize="md">{formatMoneyByCurrencyCulture(amount, currency.name)}</Text>
						<Text fontSize="xs" color="gray.500">{formatDate(date, i18n)}</Text>
					</Stack>

					<CardActionButtons
						size="sm"
						onEdit={() => props.onEditClicked(props.debt)}
						onDelete={() => props.onDeleteClicked(props.debt)}
					/>
				</Flex>

				<Flex pt={3} mt={3} borderTopWidth="1px" borderColor="border_primary" wrap="wrap" alignItems="center" gap={2} onClick={(e) => e.stopPropagation()}>
					<Button
						size="xs"
						variant="outline"
						borderRadius="full"
						px={2}
						py={0.5}
						color="action_primary"
						borderColor="border_primary"
						onClick={() => props.onManageTagsClicked(props.debt)}
					>
						<MdSettings />
					</Button>

					{debtTags && debtTags.map((tag) => (
						<DebtTagBadge
							key={tag.id}
							name={tag.name}
							colorHex={tag.colorHex}
						/>
					))}
				</Flex>
			</Card.Body>
		</Card.Root>
	);
};

export default Debt;