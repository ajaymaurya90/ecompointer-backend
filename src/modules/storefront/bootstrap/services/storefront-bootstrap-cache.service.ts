import { Injectable } from '@nestjs/common';

/**
 * ---------------------------------------------------------
 * STOREFRONT BOOTSTRAP CACHE SERVICE
 * ---------------------------------------------------------
 * Purpose:
 * Keeps a small in-memory cache of storefront bootstrap
 * payloads by normalized host for faster repeated lookups.
 *
 * Notes:
 * - Good for single-instance deployment and current stage
 * - Later can be replaced by Redis/shared cache
 * ---------------------------------------------------------
 */

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

@Injectable()
export class StorefrontBootstrapCacheService {
    // Small TTL cache keyed by normalized host.
    private readonly cache = new Map<string, CacheEntry<unknown>>();

    // 60 seconds is a good starting point for storefront bootstrap.
    private readonly ttlMs = 60 * 1000;

    /**
     * Read cache entry only if still valid.
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    /**
     * Save value with TTL.
     */
    set<T>(key: string, value: T, ttlMs?: number) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
        });
    }

    /**
     * Remove one cached host entry.
     */
    delete(key: string) {
        this.cache.delete(key);
    }

    /**
     * Remove every cached host entry.
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Remove all cached entries for a BO by scanning payload.
     * Useful after BO settings/theme/domain updates.
     */
    deleteByBrandOwnerId(brandOwnerId: string) {
        for (const [key, entry] of this.cache.entries()) {
            const payload = entry.value as any;

            if (payload?.brandOwner?.id === brandOwnerId) {
                this.cache.delete(key);
            }
        }
    }
}