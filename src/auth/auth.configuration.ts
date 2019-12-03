import { ConfigurationService } from '../configuration/configuration.service';

export class AuthConfiguration {
  constructor(private readonly config: ConfigurationService) {}

  get token(): string {
    return this.config.get('EXPA_TOKEN');
  }
}
