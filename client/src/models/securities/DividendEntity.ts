import { BaseEntity } from "@/models/common/BaseEntity";
import { SecurityEntity, SecurityEntityResponse } from "./SecurityEntity";

export interface CommonDividendEntity extends BaseEntity {
    amount: number;
}

export interface DividendEntityRequest extends CommonDividendEntity {
    declarationDate: string;
    snapshotDate: string;
    securityId: string;
}

export interface DividendEntity extends CommonDividendEntity {
    declarationDate: Date;
    snapshotDate: Date;
    security: SecurityEntity;
}

export interface DividendEntityResponse extends CommonDividendEntity {
    declarationDate: string;
    snapshotDate: string;
    security: SecurityEntityResponse;
}
