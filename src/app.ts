import { Request, Response } from 'express';
import { AnalyticsService } from './analytics/analytics.service';
import { ExpaRestRepository } from './expa/expa-rest.repository';
import { ConfigurationService } from './configuration/configuration.service';
import { ExpaConfiguration } from './expa/expa.configuration';
import { AuthConfiguration } from './auth/auth.configuration';
import * as util from 'util';

export const analytics = async (): Promise<void> => {
  console.log('Running');
  const configuration = new ConfigurationService();
  const expaRepository = new ExpaRestRepository(
    new ExpaConfiguration(configuration),
    new AuthConfiguration(configuration),
  );
  const expaService = new AnalyticsService(expaRepository);

  try {
    const analytics = await expaService.getOldAnalytics(
      '2018-08-01',
      '2019-07-31',
      '1589',
    );
    console.log(util.inspect(analytics, { depth: 4 }));
  } catch (error) {
    console.error(error);
  }
};
analytics();