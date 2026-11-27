import { BaseEntity } from "@/models/common/BaseEntity";

export interface UserDashboardEntity extends BaseEntity {
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

export interface UpdateUserDashboardLayoutRequest extends BaseEntity {
    layoutJson: string;
}

export interface RenameUserDashboardRequest extends BaseEntity {
    title: string;
}
