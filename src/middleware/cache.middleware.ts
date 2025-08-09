import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Create a cache instance with 5-minute TTL for API responses
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string; // Custom cache key generator
  skipCache?: (req: Request) => boolean; // Function to determine if caching should be skipped
}

/**
 * Caching middleware for expensive API operations
 * Implements Sub-task 6.2 of Sprint 29 Task 6
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { 
    ttl = 300, // Default 5 minutes
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching in test environment or if specified
    if (process.env.NODE_ENV === 'test' || skipCache(req)) {
      next();
      return;
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    // Check if response is cached
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse) {
      // Add cache headers
      res.set({
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `public, max-age=${ttl}`
      });
      
      res.json(cachedResponse);
      return;
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache the response
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(cacheKey, body, ttl);
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Default cache key generator
 * Creates a key based on user ID, method, path, and query parameters
 */
function defaultKeyGenerator(req: Request): string {
  const userId = req.user?.userId || 'anonymous';
  const method = req.method;
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `api:${userId}:${method}:${path}:${query}`;
}

/**
 * Cache key generator for user-specific endpoints
 */
export const userSpecificKeyGenerator = (req: Request): string => {
  const userId = req.user?.userId || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `user:${userId}:${path}:${query}`;
};

/**
 * Cache key generator for primitive-specific endpoints
 */
export const primitiveSpecificKeyGenerator = (req: Request): string => {
  const userId = req.user?.userId || 'anonymous';
  const primitiveId = req.params.id || 'all';
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `primitive:${userId}:${primitiveId}:${path}:${query}`;
};

/**
 * Invalidate cache entries by pattern
 */
export const invalidateCache = (pattern: string): void => {
  const keys = apiCache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  matchingKeys.forEach(key => {
    apiCache.del(key);
  });
  
  console.log(`Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
};

/**
 * Invalidate all cache entries for a specific user
 */
export const invalidateUserCache = (userId: number): void => {
  invalidateCache(`user:${userId}:`);
  invalidateCache(`api:${userId}:`);
};

/**
 * Invalidate cache entries for a specific primitive
 */
export const invalidatePrimitiveCache = (userId: number, primitiveId: string): void => {
  invalidateCache(`primitive:${userId}:${primitiveId}:`);
  invalidateCache(`user:${userId}:`); // Also invalidate user-level caches
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    keys: apiCache.keys().length,
    hits: apiCache.getStats().hits,
    misses: apiCache.getStats().misses,
    hitRate: apiCache.getStats().hits / (apiCache.getStats().hits + apiCache.getStats().misses) || 0
  };
};

export default cacheMiddleware;
