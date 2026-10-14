import config from "@/config";
import { Nullable } from "@/shared/utilities/nullable";

export const getStoredIconUrl = (controllerName: string, iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return `${config.api.URL}/${controllerName}/Icon?iconKey=${iconKey}`;
};