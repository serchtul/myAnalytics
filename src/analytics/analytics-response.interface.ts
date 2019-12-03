import { Product, ProductResults } from '../common/types';

export type AnalyticsResponse = Partial<
  { [p in Product]: Partial<ProductResults> }
> & {
  entityId: string;
};
