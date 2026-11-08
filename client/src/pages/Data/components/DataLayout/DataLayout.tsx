import { Box, Flex } from "@chakra-ui/react";
import DataSidebar from "@/pages/Data/components/DataSidebar/DataSidebar";

export default function DataLayout({ children }: { children: React.ReactNode }) {
	return (
		<Flex direction={{ base: "column", lg: "row" }} gap={{ base: 4, lg: 6 }} align="flex-start">
			<DataSidebar />
			<Box flex={1} minW={0} w="100%">
				{children}
			</Box>
		</Flex>
	);
}
