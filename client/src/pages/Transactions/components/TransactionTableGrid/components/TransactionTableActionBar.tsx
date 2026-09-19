import React from 'react';
import { Button, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCheckCircle, MdOutlineRefresh, MdUndo } from 'react-icons/md';

interface TransactionTableActionBarProps {
    hasChanges: boolean;
    modifiedCount: number;
    addedCount: number;
    deletedCount: number;
    isSaving: boolean;
    onAddRow: () => void;
    onRefresh: () => void;
    onResetAll: () => void;
    onCommit: () => void;
}

export const TransactionTableActionBar: React.FC<TransactionTableActionBarProps> = ({
    hasChanges,
    modifiedCount,
    addedCount,
    deletedCount,
    isSaving,
    onAddRow,
    onRefresh,
    onResetAll,
    onCommit,
}) => {
    const { t } = useTranslation();

    return (
        <Flex
            justify="space-between"
            align="center"
            mb={4}
            flexWrap="wrap"
            gap={3}
            bg="background_primary"
            p={3}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border_primary"
            boxShadow="xs"
        >
            <HStack gap={2}>
                <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={onAddRow}
                    px={3}
                    borderRadius="lg"
                >
                    <Icon mr={1}>
                        <MdAdd size={18} />
                    </Icon>
                    {t('table_add_row')}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    borderColor="border_primary"
                    color="text_secondary"
                    onClick={onRefresh}
                    title={t('table_refresh_tooltip')}
                    px={2}
                    borderRadius="lg"
                >
                    <Icon>
                        <MdOutlineRefresh size={18} />
                    </Icon>
                </Button>
            </HStack>

            {hasChanges && (
                <HStack gap={3}>
                    <Text fontSize="xs" fontWeight={600} color="text_primary">
                        💡 {t('table_changes_modified')}: {modifiedCount} • {t('table_changes_added')}: {addedCount} • {t('table_changes_deleted')}: {deletedCount}
                    </Text>
                    <Button
                        size="sm"
                        variant="ghost"
                        color="text_secondary"
                        onClick={onResetAll}
                    >
                        <Icon mr={1}>
                            <MdUndo />
                        </Icon>
                        {t('table_reset_changes')}
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="green"
                        loading={isSaving}
                        onClick={onCommit}
                        px={4}
                        borderRadius="lg"
                    >
                        <Icon mr={1}>
                            <MdCheckCircle />
                        </Icon>
                        {t('table_commit_changes')}
                    </Button>
                </HStack>
            )}
        </Flex>
    );
};
