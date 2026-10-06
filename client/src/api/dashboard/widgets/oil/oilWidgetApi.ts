import { getAllEntities, getEntityByConfig } from "@/api/basicApi";
import { OilWidgetEntity, OilWidgetRequest, OilWidgetResponse } from "@/models/dashboard/widgets/oil/OilWidgetEntity";
import { mapOilWidget } from "./oilWidgetApiMapping";

const basicUrl = "DashboardWidgets";

export const getOilWidget = async (
    request: OilWidgetRequest
): Promise<OilWidgetEntity> => {
    const data = await getEntityByConfig<OilWidgetResponse>(`${basicUrl}/GetOil`, request);
    if (!data) {
        return { quotes: [] };
    }
    return mapOilWidget(data);
};

export const getOilSymbols = async (): Promise<string[]> => {
    const data = await getAllEntities<string>(`${basicUrl}/GetOilSymbols`);
    return data ?? [];
};
