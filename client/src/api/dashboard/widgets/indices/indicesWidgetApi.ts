import { getAllEntities, getEntityByConfig } from "@/api/basicApi";
import {
    IndicesWidgetEntity,
    IndicesWidgetRequest,
    IndicesWidgetResponse
} from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";
import { mapIndicesWidget } from "./indicesWidgetApiMapping";

const basicUrl = "DashboardWidgets";

export const getIndicesWidget = async (
    request: IndicesWidgetRequest
): Promise<IndicesWidgetEntity> => {
    const data = await getEntityByConfig<IndicesWidgetResponse>(`${basicUrl}/GetIndices`, request);
    if (!data) {
        return { indices: [] };
    }
    return mapIndicesWidget(data);
};

export const getSupportedIndices = async (): Promise<string[]> => {
    const data = await getAllEntities<string>(`${basicUrl}/GetSupportedIndices`);
    return data ?? [];
};
