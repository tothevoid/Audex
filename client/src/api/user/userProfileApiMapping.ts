import { UserProfileEntity, UserProfileEntityRequest } from "../../models/user/UserProfileEntity";

export const prepareUserProfileRequest = (userProfile: UserProfileEntity): UserProfileEntityRequest => {
    return {
        id: userProfile.id,
        userName: userProfile.userName,
        currencyId: userProfile.currency.id,
        languageCode: userProfile.languageCode,
        timeZoneId: userProfile.timeZoneId
    }
}