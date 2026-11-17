import { LanguageEntity } from "@/models/common/LanguageEntity";
import { getAllEntities } from "@/api/basicApi";

const basicUrl = "Language";

export const getLanguages = async (): Promise<LanguageEntity[]> => {
    return await getAllEntities<LanguageEntity>(basicUrl);
};
