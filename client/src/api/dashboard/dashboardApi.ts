import { GlobalDashboard } from "@/models/dashboard/DashboardEntity";
import { getEntity } from "@/api/basicApi";

const basicUrl = `Dashboard`;

export const getDashboard = async (): Promise<GlobalDashboard | void> =>  {
    return await getEntity<GlobalDashboard>(basicUrl);
};