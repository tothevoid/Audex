import { getEntity } from "@/api/basicApi";
import { OilWidgetEntity, OilWidgetResponse } from "@/models/dashboard/widgets/oil/OilWidgetEntity";
import { mapOilWidget } from "./oilWidgetApiMapping";

const basicUrl = "DashboardWidgets";

export const getOilWidget = async (
    dashboardId: string,
    widgetId: string
): Promise<OilWidgetEntity> => {
    const data = await getEntity<OilWidgetResponse>(`${basicUrl}/GetOil?dashboardId=${dashboardId}&widgetId=${widgetId}`);
    if (!data) {
        return { quotes: [] };
    }
    return mapOilWidget(data);
};
