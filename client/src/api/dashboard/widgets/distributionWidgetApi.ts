import { getEntity } from "@/api/basicApi";
import { Nullable } from "@/shared/utilities/nullable";
import { DistributionModel } from "@/models/dashboard/DashboardEntity";

export interface DistributionWidgetDataResponse {
    total: Nullable<number>;
    distribution: DistributionModel[];
}

export const getDistributionWidgetData = async (
    endpoint: string
): Promise<Nullable<DistributionWidgetDataResponse>> => {
    const response = await getEntity<DistributionWidgetDataResponse>(`DashboardWidgets/${endpoint}`);
    return response ?? null;
};
