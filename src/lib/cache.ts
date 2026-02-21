import { Campaign } from "./contract";

const CACHE_TTL_MS = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached campaigns

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
}

class CampaignCache {
  private campaigns = new Map<number, CacheEntry<Campaign>>();
  private count: CacheEntry<number> | null = null;

  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL_MS;
  }

  getCampaign(id: number): Campaign | null {
    const entry = this.campaigns.get(id);
    if (entry && this.isValid(entry.timestamp)) {
      entry.accessCount++;
      return entry.data;
    }
    return null;
  }

  setCampaign(id: number, campaign: Campaign): void {
    // Evict least recently used if cache is full
    if (this.campaigns.size >= MAX_CACHE_SIZE) {
      let lruKey = -1;
      let minAccessCount = Infinity;
      
      this.campaigns.forEach((entry, key) => {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          lruKey = key;
        }
      });
      
      if (lruKey !== -1) {
        this.campaigns.delete(lruKey);
      }
    }
    
    this.campaigns.set(id, { data: campaign, timestamp: Date.now(), accessCount: 0 });
  }

  getCount(): number | null {
    if (this.count && this.isValid(this.count.timestamp)) {
      return this.count.data;
    }
    return null;
  }

  setCount(count: number): void {
    this.count = { data: count, timestamp: Date.now(), accessCount: 0 };
  }

  invalidate(): void {
    this.campaigns.clear();
    this.count = null;
  }

  invalidateCampaign(id: number): void {
    this.campaigns.delete(id);
    this.count = null;
  }
}

export const campaignCache = new CampaignCache();
