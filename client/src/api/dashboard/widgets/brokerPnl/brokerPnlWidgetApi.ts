import { getEntityByConfig } from "@/api/basicApi";
import {
    BrokerPnlWidgetEntity,
    BrokerPnlWidgetRequest
} from "@/models/dashboard/widgets/brokerPnl/BrokerPnlWidgetEntity";

const basicUrl = "DashboardWidgets";

export const getBrokerPnlWidget = async (
    request: BrokerPnlWidgetRequest
): Promise<BrokerPnlWidgetEntity | null> => {
    const data = await getEntityByConfig<BrokerPnlWidgetEntity>(
        `${basicUrl}/GetBrokerPnl`,
        request
    );
    return data ?? null;
};
