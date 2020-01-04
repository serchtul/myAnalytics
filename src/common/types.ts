export enum Product {
  IGV = 'iGV',
  OGV = 'oGV',
  IGE = 'iGE',
  OGE = 'oGE',
  IGT = 'iGT',
  OGT = 'oGT',
}

export enum ProductStages {
  APPLIED = 'applied',
  ACCEPTED = 'accepted',
  APPROVED = 'approved',
  REALIZED = 'realized',
  FINISHED = 'finished',
  COMPLETED = 'completed',
}

export type ProductResults = {
  [stage in ProductStages]: number;
};

export enum EntityType {
  LC = 'Local Committee',
  MC = 'Member Committee',
  RO = 'Regional Office',
  AI = 'AIESEC International',
}

export interface ExpaEntity {
  id: string;
  name: string;
  type: EntityType;
  entities?: ExpaEntity[];
}
