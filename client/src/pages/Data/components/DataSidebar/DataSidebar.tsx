import { Box, Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDataTablesConfig } from "@/pages/Data/dataTablesUtilities";

export default function DataSidebar() {
	const { t } = useTranslation();
	const dataTablesConfig = getDataTablesConfig(t);

	return (
		<Box
			as="aside"
			w="240px"
			minW="240px"
			bg="background_primary"
			borderRadius="lg"
			border="1px solid"
			borderColor="border_primary"
			p={3}
			position="sticky"
			top="74px"
		>
			<Stack gap={2}>
				<Text fontSize="lg" fontWeight="bold" px={3} py={2} color="text_primary">
					{t("data_title")}
				</Text>
				{dataTablesConfig.map((menuItem) => (
					<NavLink
						key={menuItem.id}
						to={menuItem.href}
						style={{ textDecoration: "none" }}
					>
						{({ isActive }) => (
							<Box
								px={3}
								py={2}
								borderRadius="md"
								bg={isActive ? "background_secondary" : "transparent"}
								color={isActive ? "action_primary" : "text_primary"}
								fontWeight={isActive ? "semibold" : "normal"}
								_hover={{ bg: "background_secondary" }}
								transition="all 0.15s ease"
							>
								{menuItem.label}
							</Box>
						)}
					</NavLink>
				))}
			</Stack>
		</Box>
	);
}