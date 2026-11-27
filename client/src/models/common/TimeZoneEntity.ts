import { BaseEntity } from "@/models/common/BaseEntity";

export interface TimeZoneEntity extends BaseEntity {
    displayName: string;
    baseUtcOffsetMinutes: number;
}
