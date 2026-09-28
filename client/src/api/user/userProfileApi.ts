import { UserProfileEntity } from "@/models/user/UserProfileEntity";
import { getEntity, updateEntity } from "@/api/basicApi";
import { prepareUserProfileRequest } from "./userProfileApiMapping";

const basicUrl = `UserProfile`;

export const getUserProfile = async (): Promise<UserProfileEntity | void> =>  {
    return getEntity<UserProfileEntity>(basicUrl);
};

export const updateUserProfile = async (userProfile: UserProfileEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareUserProfileRequest(userProfile));
};