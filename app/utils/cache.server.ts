import LRUCache from 'lru-cache'

export let NO_CACHE = process.env.NO_CACHE ?? false
export let SALT = process.env.CRUNCHY_CACHE_SALT ?? Date.now()

export function createCache<T>(fetchMethod: LRUCache.Fetcher<string, T>) {
	return new LRUCache<string, T>({
		max: 1000,
		ttl: NO_CACHE ? 1 : 1000 * 60 * 60 * 24 * 365, // 1 year
		allowStale: !NO_CACHE,
		noDeleteOnFetchRejection: true,
		fetchMethod,
	})
}
