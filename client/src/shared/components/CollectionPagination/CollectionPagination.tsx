import React, { Fragment, useEffect, useState } from 'react';
import { ButtonGroup, Flex, IconButton, Pagination } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { PaginationConfig } from '../../models/PaginationConfig';

interface Props {
	getPaginationConfig?: () => Promise<PaginationConfig | void>;
	onPageChanged?: (pageSize: number, currentPage: number) => void;
	count?: number;
	page?: number;
	pageSize?: number;
	onPageChange?: (page: number, pageSize: number) => void;
	size?: "xs" | "sm" | "md" | "lg";
}

interface State {
	pageSize: number;
	recordsQuantity: number;
}

const CollectionPagination: React.FC<Props> = ({
	getPaginationConfig,
	onPageChanged,
	count,
	page = 1,
	pageSize: controlledPageSize,
	onPageChange: controlledOnPageChange,
	size = "md"
}) => {
	const isControlled = count !== undefined;
	const [state, setState] = useState<State>({ pageSize: -1, recordsQuantity: -1 });

	useEffect(() => {
		if (isControlled || !getPaginationConfig) {
			return;
		}

		const initializeData = async () => {
			await requestPaginationConfig();
		};

		initializeData();
	}, [getPaginationConfig, isControlled]);

	const requestPaginationConfig = async () => {
		if (!getPaginationConfig) {
			return;
		}

		const paginationConfig = await getPaginationConfig();
		if (!paginationConfig) {
			return;
		}

		setState({
			pageSize: paginationConfig.pageSize,
			recordsQuantity: paginationConfig.recordsQuantity
		});

		onPageChanged?.(paginationConfig.pageSize, 0);
	};

	const handlePageChange = (newPage: number, newPageSize: number) => {
		if (controlledOnPageChange) {
			controlledOnPageChange(newPage, newPageSize);
		} else if (onPageChanged) {
			onPageChanged(newPageSize, newPage);
		}
	};

	const effectivePageSize = isControlled ? (controlledPageSize ?? 10) : state.pageSize;
	const effectiveTotalCount = isControlled ? count : state.recordsQuantity;

	if (effectivePageSize <= 0 || effectiveTotalCount <= effectivePageSize) {
		return <Fragment />;
	}

	return (
		<Flex justifyContent="center">
			<Pagination.Root
				{...(isControlled ? { page } : { defaultPage: 1 })}
				onPageChange={({ page: nextPage, pageSize: nextPageSize }) => handlePageChange(nextPage, nextPageSize)}
				count={effectiveTotalCount}
				pageSize={effectivePageSize}
			>
				<ButtonGroup variant="ghost" size={size}>
					<Pagination.PrevTrigger asChild>
						<IconButton color="text_primary" size={size}>
							<LuChevronLeft />
						</IconButton>
					</Pagination.PrevTrigger>
					<Pagination.Items
						render={pageItem => (
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
		</Flex>
	);
};

export default CollectionPagination;