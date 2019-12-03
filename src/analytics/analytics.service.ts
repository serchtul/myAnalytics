import { ExpaRestRepository } from '../expa/expa-rest.repository';
import { AnalyticsResponse } from './analytics-response.interface';
import { ExpaEntity, EntityType } from '../common/types';

export class AnalyticsService {
  constructor(private readonly expaRepository: ExpaRestRepository) {}

  async getOldAnalytics(
    startDate: string,
    endDate: string,
    officeId: string,
  ): Promise<AnalyticsResponse[]> {
    const entity: ExpaEntity = {
      id: officeId,
      name: 'name',
      type: EntityType.MC,
    };
    return this.expaRepository
      .getOldAnalytics$(entity, startDate, endDate)
      .toPromise();
  }
}
