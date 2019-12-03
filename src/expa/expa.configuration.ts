import { ConfigurationService } from '../configuration/configuration.service';
import { Product } from '../common/types';

interface ProductConfiguration {
  name: Product;
  type: string;
  product: string;
}

export class ExpaConfiguration {
  constructor(private readonly config: ConfigurationService) {}

  get apiVersion(): string {
    const apiVersion = this.config.get('EXPA_API_VERSION');
    return apiVersion ? apiVersion : 'v2';
  }

  get apiBaseUrl(): string {
    return this.config.get('EXPA_BASE_URL');
  }

  get analyticsProductConfigurations(): ProductConfiguration[] {
    return [
      this.iGVAnalyticsConfiguration,
      this.iGTAnalyticsConfiguration,
      this.iGEAnalyticsConfiguration,
      this.oGVAnalyticsConfiguration,
      this.oGTAnalyticsConfiguration,
      this.oGEAnalyticsConfiguration,
    ];
  }

  get iGVAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.IGV,
      product: this.config.get('EXPA_GV_ID'),
      type: this.config.get('EXPA_ICX_ID'),
    };
  }

  get iGTAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.IGT,
      product: this.config.get('EXPA_GT_ID'),
      type: this.config.get('EXPA_ICX_ID'),
    };
  }

  get iGEAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.IGE,
      product: this.config.get('EXPA_GE_ID'),
      type: this.config.get('EXPA_ICX_ID'),
    };
  }

  get oGVAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.OGV,
      product: this.config.get('EXPA_GV_ID'),
      type: this.config.get('EXPA_OGX_ID'),
    };
  }

  get oGTAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.OGT,
      product: this.config.get('EXPA_GT_ID'),
      type: this.config.get('EXPA_OGX_ID'),
    };
  }

  get oGEAnalyticsConfiguration(): ProductConfiguration {
    return {
      name: Product.OGE,
      product: this.config.get('EXPA_GE_ID'),
      type: this.config.get('EXPA_OGX_ID'),
    };
  }
}
