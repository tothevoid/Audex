export interface UserDashboardEntity {
    id: string;
    userProfileId: string;
    title: string;
    isDefault: boolean;
    order: number;
    layoutJson: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDashboardRequest {
    title: string;
    layoutJson?: string;
}

export interface UpdateUserDashboardLayoutRequest {
    id: string;
    layoutJson: string;
}

export interface RenameUserDashboardRequest {
    id: string;
    title: string;
}
