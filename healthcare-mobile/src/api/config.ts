export interface ApiConfiguration {
  developmentUrls: { android: string; ios: string };
  productionUrl: string | null;
}

export function resolveApiBase(config: ApiConfiguration, development: boolean, platform: string): string {
  if (!development) {
    if (!config.productionUrl) {
      throw new Error('MOBILE_API_URL is required for production. Regenerate API configuration with the real HTTPS API base URL and rebuild.');
    }
    return config.productionUrl;
  }
  if (platform !== 'android' && platform !== 'ios') {
    throw new Error(`Unsupported mobile platform: ${platform}`);
  }
  return config.developmentUrls[platform];
}
