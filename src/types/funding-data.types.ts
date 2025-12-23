export type Platform = 'github';

export interface FundingData {
  platform: Platform;
  username: string;
  currentAmount: number;
  currency: string;
  isRecurring: boolean;
  breakdown?: {
    sponsors: number;
    tiers?: Array<{
      amount: number;
      count: number;
    }>;
  };
  lastUpdated: Date;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: Date;
}

export interface BadgeOptions {
  current: number;
  goal: number;
  style: 'flat' | 'flat-square' | 'for-the-badge';
  label: string;
  logo?: string;
  color?: string;
}
