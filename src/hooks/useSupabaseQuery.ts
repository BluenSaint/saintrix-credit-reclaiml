import { useState, useEffect, useCallback } from 'react';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '@/lib/supabase';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface QueryOptions {
  cacheTime?: number; // Time in milliseconds to cache the result
  enabled?: boolean; // Whether the query should run
}

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheItem<any>>();

export function useSupabaseQuery<T = any>(
  queryKey: string,
  queryFn: () => PostgrestFilterBuilder<any, any, any>,
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchData = useCallback(
    async (force = false) => {
      const cacheItem = cache.get(queryKey);
      const now = Date.now();
      const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;

      // Return cached data if it's still valid and not forcing a refetch
      if (!force && cacheItem && now - cacheItem.timestamp < cacheTime) {
        setData(cacheItem.data);
        setIsLoading(false);
        return;
      }

      try {
        setIsRefetching(true);
        const { data: result, error: queryError } = await queryFn();

        if (queryError) throw queryError;

        // Update cache
        cache.set(queryKey, {
          data: result,
          timestamp: now,
        });

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [queryKey, queryFn, options.cacheTime]
  );

  // Initial fetch
  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    cache.delete(queryKey);
  }, [queryKey]);

  // Refetch data
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    invalidate,
  };
}

// Example usage:
/*
const { data, isLoading, error } = useSupabaseQuery(
  'clients',
  () => supabase.from('clients').select('*'),
  { cacheTime: 1000 * 60 } // 1 minute cache
);
*/
