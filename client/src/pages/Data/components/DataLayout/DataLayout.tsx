import { Box, Flex } from "@chakra-ui/react";
import DataSidebar from "@/pages/Data/components/DataSidebar/DataSidebar";

export default function DataLayout({ children }: { children: React.ReactNode }) {
	return (
		<Flex gap={6} align="flex-start">
			<DataSidebar />
			<Box flex={1} minW={0}>
				{children}
			</Box>
		</Flex>
	);
}
