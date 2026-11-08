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
			w={{ base: "100%", lg: "240px" }}
			minW={{ base: "100%", lg: "240px" }}
			bg="background_primary"
			borderRadius="lg"
			border="1px solid"
			borderColor="border_primary"
			p={3}
			position={{ base: "static", lg: "sticky" }}
			top="74px"
		>
			<Stack
				direction={{ base: "row", lg: "column" }}
				overflowX={{ base: "auto", lg: "visible" }}
				gap={2}
				scrollbarWidth="none"
				css={{
					"&::-webkit-scrollbar": {
						display: "none"
					}
				}}
			>
				<Text
					fontSize="lg"
					fontWeight="bold"
					px={3}
					py={2}
					color="text_primary"
					display={{ base: "none", lg: "block" }}
				>
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
								whiteSpace="nowrap"
								flexShrink={0}
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
