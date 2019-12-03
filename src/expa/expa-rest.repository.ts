import { AuthConfiguration } from '../auth/auth.configuration';
import axios from 'axios';
import { ExpaConfiguration } from './expa.configuration';
import { ExpaEntity } from '../common/types';
import { ExpaException } from './expa.exception';
import {
  AnalyticsDTO,
  OldAnalyticsDTO,
} from '../analytics/analytics-dto.interface';
import { AnalyticsResponse } from '../analytics/analytics-response.interface';
import { Observable, defer, EMPTY } from 'rxjs';
import { map, catchError, merge, tap, reduce } from 'rxjs/operators';
import { AnalyticsResponseFactory } from '../analytics/analytics-response.factory';
import * as querystring from 'querystring';

export class ExpaRestRepository {
  private readonly accessToken: string;
  private readonly apiBaseUrl: string;
  private readonly apiVersion: string;

  constructor(
    private readonly expaConfig: ExpaConfiguration,
    authConfig: AuthConfiguration,
  ) {
    this.apiBaseUrl = expaConfig.apiBaseUrl;
    this.apiVersion = expaConfig.apiVersion;
    this.accessToken = authConfig.token;
  }

  getOldAnalytics$(
    entity: ExpaEntity,
    startDate: string,
    endDate: string,
  ): Observable<AnalyticsResponse[]> {
    return this.expaConfig.analyticsProductConfigurations
      .reduce(
        (observable, configuration) =>
          this.getDataFor$<OldAnalyticsDTO>('applications/analyze', {
            [`start_date`]: startDate,
            [`end_date`]: endDate,
            [`basic[home_office_id]`]: entity.id,
            [`basic[type]`]: configuration.type,
            [`programmes[]`]: configuration.product,
          }).pipe(
            // TODO: Replace with proper Logger Service
            tap(() => console.log(`Got response for ${configuration.name}`)),
            map(dto =>
              AnalyticsResponseFactory.arrayFromOldDTO(dto, configuration.name),
            ),
            merge(observable),
          ),
        EMPTY as Observable<AnalyticsResponse[]>,
      )
      .pipe(
        reduce(
          AnalyticsResponseFactory.mergeResponses,
          [] as AnalyticsResponse[],
        ),
      );
  }

  getAnalytics$(
    entity: ExpaEntity,
    startDate: string,
    endDate: string,
  ): Observable<AnalyticsResponse[]> {
    return this.getDataFor$<AnalyticsDTO>('applications/analyze', {
      [`start_date`]: startDate,
      [`end_date`]: endDate,
      [`performance_v3[office_id]`]: entity.id,
    }).pipe(map(AnalyticsResponseFactory.arrayFromDTO));
  }

  private getDataFor$<T>(
    endpoint: string,
    params?: { [key: string]: string },
  ): Observable<T> {
    return defer(() =>
      axios
        .get(`${this.apiBaseUrl}/${this.apiVersion}/${endpoint}.json`, {
          params: {
            [`access_token`]: this.accessToken,
            ...params,
          },
          paramsSerializer: querystring.encode,
        })
        .then(({ data }) => data as T),
    ).pipe(
      catchError(error => {
        throw ExpaException.from(error);
      }),
    );
  }
}
