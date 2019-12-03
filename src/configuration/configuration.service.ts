import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigurationService {
  private readonly envConfig: Record<string, string>;

  constructor() {
    this.envConfig = dotenv.parse(fs.readFileSync('.env'));
  }

  get(key: string, defaultValue?: string): string {
    return this.envConfig[key] ?? defaultValue;
  }
}
