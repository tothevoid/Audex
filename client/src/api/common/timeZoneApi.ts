import { TimeZoneEntity } from "../../models/common/TimeZoneEntity";
import { getAllEntities } from "../basicApi";

const basicUrl = "TimeZone";

export const getTimeZones = async (): Promise<TimeZoneEntity[]> => {
    return await getAllEntities<TimeZoneEntity>(basicUrl);
};
