import React, { Fragment } from 'react';
import { Box, ButtonGroup, Flex, HStack, IconButton, NativeSelect, Pagination, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useTranslation } from 'react-i18next';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Props {
	count: number;
	page?: number;
	pageSize?: number;
	pageSizeOptions?: number[];
	showPageSizeSelector?: boolean;
	showTotalCount?: boolean;
	onPageChange: (page: number, pageSize: number) => void;
	size?: "xs" | "sm" | "md" | "lg";
}

const CollectionPagination: React.FC<Props> = ({
	count,
	page = 1,
	pageSize = 10,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
	showPageSizeSelector = true,
	showTotalCount = true,
	onPageChange,
	size = "md"
}) => {
	const { t } = useTranslation();

	if (count <= 0 || pageSize <= 0) {
		return <Fragment />;
	}

	const hasMultiplePages = count > pageSize;

	if (!hasMultiplePages && !showPageSizeSelector && !showTotalCount) {
		return <Fragment />;
	}

	const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newPageSize = parseInt(event.target.value, 10);
		if (!isNaN(newPageSize) && newPageSize > 0) {
			onPageChange(1, newPageSize);
		}
	};

	return (
		<Flex
			alignItems="center"
			justifyContent="space-between"
			flexWrap="wrap"
			gap={3}
			py={3}
		>
			<HStack gap={3}>
				{showTotalCount && (
					<Text fontSize="xs" color="text_secondary" fontWeight="medium">
						{t("general_total_count", { count })}
					</Text>
				)}

				{showPageSizeSelector && (
					<HStack gap={1.5}>
						<Text fontSize="xs" color="text_secondary" display={{ base: "none", sm: "block" }}>
							{t("pagination_page_size_label")}
						</Text>
						<NativeSelect.Root size="xs" minWidth="115px">
							<NativeSelect.Field
								value={pageSize}
								onChange={handlePageSizeChange}
								backgroundColor="background_primary"
								borderColor="border_primary"
								color="text_primary"
								fontSize="xs"
								height="28px"
								py={0.5}
								pl={2.5}
								pr={7}
								cursor="pointer"
								borderRadius="md"
							>
								{pageSizeOptions.map((optionSize) => (
									<option
										key={optionSize}
										value={optionSize}
										style={{ backgroundColor: "var(--chakra-colors-background_primary)", color: "var(--chakra-colors-text_primary)" }}
									>
										{t("pagination_page_size_item", { size: optionSize })}
									</option>
								))}
							</NativeSelect.Field>
							<NativeSelect.Indicator />
						</NativeSelect.Root>
					</HStack>
				)}
			</HStack>

			{hasMultiplePages ? (
				<Pagination.Root
					page={page}
					onPageChange={({ page: nextPage, pageSize: nextPageSize }) => onPageChange(nextPage, nextPageSize)}
					count={count}
					pageSize={pageSize}
				>
					<ButtonGroup variant="ghost" size={size}>
						<Pagination.PrevTrigger asChild>
							<IconButton color="text_primary" size={size}>
								<LuChevronLeft />
							</IconButton>
						</Pagination.PrevTrigger>
						<Pagination.Items
							render={(pageItem) => (
								<IconButton
									color="text_primary"
									size={size}
									variant={{ base: "ghost", _selected: "outline" }}
								>
									{pageItem.value}
								</IconButton>
							)}
						/>
						<Pagination.NextTrigger asChild>
							<IconButton color="text_primary" size={size}>
								<LuChevronRight />
							</IconButton>
						</Pagination.NextTrigger>
					</ButtonGroup>
				</Pagination.Root>
			) : (
				<Box />
			)}
		</Flex>
	);
};

export default CollectionPagination;