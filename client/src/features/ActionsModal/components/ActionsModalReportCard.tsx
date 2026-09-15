import React, { useState } from 'react';
import { Box, Button, Card, Flex, Icon, Spinner, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdTableChart, MdDownload } from 'react-icons/md';
import { downloadAllAssetsReportXlsx } from '../../../api/reports/allAssetsReport';
import { formatTimestampForReport } from '../../../shared/utilities/dateUtils';

export const ActionsModalReportCard: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadReport = async () => {
        setIsLoading(true);
        try {
            const blob = await downloadAllAssetsReportXlsx();
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = formatTimestampForReport(new Date());
                a.download = `assets_${timestamp}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card.Root
            variant="outline"
            borderColor="border_primary"
            backgroundColor="background_secondary"
            borderRadius="md"
        >
            <Card.Body p={4}>
                <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={4}>
                    <Flex align="center" gap={3}>
                        <Flex
                            w="44px"
                            h="44px"
                            borderRadius="lg"
                            bg="blue.500/15"
                            color="blue.400"
                            align="center"
                            justify="center"
                            flexShrink={0}
                        >
                            <Icon fontSize="24px">
                                <MdTableChart />
                            </Icon>
                        </Flex>
                        <Box>
                            <Text fontWeight="bold" fontSize="md" color="text_primary">
                                {t("action_download_report_title")}
                            </Text>
                            <Text fontSize="xs" color="gray.400" mt={1}>
                                {t("action_download_report_desc")}
                            </Text>
                        </Box>
                    </Flex>
                    <Button
                        colorPalette="blue"
                        variant="subtle"
                        size="sm"
                        onClick={handleDownloadReport}
                        disabled={isLoading}
                        minW="140px"
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="xs" mr={2} />
                                {t("action_download_report_downloading")}
                            </>
                        ) : (
                            <>
                                <Icon mr={1}>
                                    <MdDownload />
                                </Icon>
                                {t("action_download_report_btn")}
                            </>
                        )}
                    </Button>
                </Flex>
            </Card.Body>
        </Card.Root>
    );
};
