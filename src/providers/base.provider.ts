import type { FundingData, RateLimitInfo } from '../types/funding-data.types.js';

export abstract class BaseFundingProvider {
  abstract platform: string;

  abstract getFundingData(username: string, token?: string): Promise<FundingData>;

  abstract validateUsername(username: string): boolean;

  abstract getRateLimitInfo(): Promise<RateLimitInfo>;

  protected async fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;

        const delay = baseDelay * Math.pow(2, i); // exponential backoff
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
