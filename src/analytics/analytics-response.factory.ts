import { AnalyticsDTO, OldAnalyticsDTO } from './analytics-dto.interface';
import { AnalyticsResponse } from './analytics-response.interface';
import { Product, ProductStages, ProductResults } from '../common/types';

export class AnalyticsResponseFactory {
  static mergeResponses(
    r1: AnalyticsResponse[],
    r2: AnalyticsResponse[],
  ): AnalyticsResponse[] {
    const eyIds = Array.from(
      new Set([
        ...r1.map(response => response.entityId),
        ...r2.map(response => response.entityId),
      ]),
    );
    return eyIds.map(id => {
      const r1Value = r1.find(response => response.entityId === id);
      const r2Value = r2.find(response => response.entityId === id);
      return {
        ...r1Value,
        ...r2Value,
      } as AnalyticsResponse;
    });
  }

  static arrayFromOldDTO(
    dto: OldAnalyticsDTO,
    product: Product,
  ): AnalyticsResponse[] {
    const buckets = dto.analytics.children.buckets;
    return buckets.map(bucket => ({
      entityId: bucket.key,
      [product]: {
        [ProductStages.ACCEPTED]: bucket.total_an_accepted.doc_count,
        [ProductStages.APPLIED]: bucket.total_applications.doc_count,
        [ProductStages.APPROVED]: bucket.total_approvals.doc_count,
        [ProductStages.REALIZED]: bucket.total_realized.doc_count,
        [ProductStages.FINISHED]: bucket.total_finished.doc_count,
        [ProductStages.COMPLETED]: bucket.total_completed.doc_count,
      },
    }));
  }

  static arrayFromDTO(dto: AnalyticsDTO): AnalyticsResponse[] {
    return Object.entries(dto).map(([entityId, eyLabels]) =>
      Object.values(Product).reduce(
        (obj, fullName) => {
          const xType = fullName.charAt(0);
          const product = fullName.substring(1).toLowerCase();
          const productResults = Object.values(ProductStages).reduce(
            (obj, stage) => {
              const expaLabel = `${xType}_${stage}_${product}`;
              const docCount = eyLabels[expaLabel]?.doc_count;
              if (docCount) {
                obj[stage] = docCount;
              }
              return obj;
            },
            {} as Partial<ProductResults>,
          );

          if (Object.entries(productResults).length > 0) {
            obj[fullName] = productResults;
          }
          return obj;
        },
        { entityId } as AnalyticsResponse,
      ),
    );
  }
}
