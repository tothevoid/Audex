export enum AuthErrorCode {
    InvalidCredentials = 'INVALID_CREDENTIALS',
    ServerUnavailable = 'SERVER_UNAVAILABLE',
    Unknown = 'UNKNOWN'
}

export type AuthPasswordChangeRequiredResult = {
    success: true;
    passwordChangeRequired: true;
};

export type AuthTokenResult = {
    success: true;
    passwordChangeRequired: false;
    token: string;
};

export type AuthSuccessResult = AuthPasswordChangeRequiredResult | AuthTokenResult;

export type AuthErrorResult = {
    success: false;
    errorCode: AuthErrorCode;
};

export type AuthResult = AuthSuccessResult | AuthErrorResult;

export type ChangePasswordSuccessResult = {
    success: true;
    token: string;
};

export type ChangePasswordErrorResult = {
    success: false;
    errorCode: AuthErrorCode;
};

export type ChangePasswordResult = ChangePasswordSuccessResult | ChangePasswordErrorResult;
