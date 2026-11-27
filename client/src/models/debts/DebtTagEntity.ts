import { BaseEntity } from "@/models/common/BaseEntity";

export interface DebtTagEntity extends BaseEntity {
    name: string;
    colorHex: string;
    usageCount?: number;
}

export interface DebtTagStatsEntity {
    tagId: string;
    tagName: string;
    colorHex: string;
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    repaymentPercentage: number;
    currencyName?: string;
}
