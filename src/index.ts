/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line import/no-unassigned-import
import 'reflect-metadata';
import cacheManager, {type Cache} from 'cache-manager';
import {redisStore} from 'cache-manager-redis-store';
import {get} from 'lodash';

type CacheInitializationConfig = {
	host?: string;
	port?: number;
	password?: string;
	ttl: number;
};

type KeySelector = ((...arguments_: unknown[]) => unknown[]) | string | string[];

type CacheOptions = {
	ttl: number;
	keySelector: KeySelector;
} & Partial<CacheInitializationConfig>;

let cacheManagerInstance: Cache | undefined;

/**
 * Initializes the cache manager with Redis store by default.
 */
async function initializeCache(config: CacheInitializationConfig): Promise<void> {
	cacheManagerInstance = await cacheManager.caching({
		store: redisStore,
		host: config.host ?? 'localhost',
		port: config.port ?? 6379,
		password: config.password,
		ttl: config.ttl,
	});
}

/**
 * Automatically initializes cache if not already initialized and initialization data is present.
 */
async function ensureCacheInitialized(config?: CacheInitializationConfig): Promise<void> {
	if (!cacheManagerInstance && config) {
		await initializeCache(config);
	}
}

/**
 * Decorator to provide metadata for caching with TTL and key selection.
 */
export function cacheMeta(options: CacheOptions) {
	return async (target: unknown, propertyKey: string): Promise<void> => {
		await ensureCacheInitialized(options);
		Reflect.defineMetadata('cacheKeySelector', options.keySelector, target, propertyKey);
		Reflect.defineMetadata('cacheTtl', options.ttl, target, propertyKey);
	};
}

/**
 * Decorator to handle caching directly with TTL and key selection.
 */
export function cache(options: CacheOptions) {
	return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void => {
		ensureCacheInitialized(options).catch((error: unknown) => {
			console.error(error);
		});
		const originalMethod = descriptor.value;

		descriptor.value = async function (...arguments_: unknown[]): Promise<unknown> {
			if (!cacheManagerInstance) {
				throw new Error('Cache not initialized.');
			}

			const cacheKey = createCacheKey(arguments_, options.keySelector);
			const cachedResult = await cacheManagerInstance.get(cacheKey);
			if (cachedResult) {
				return cachedResult;
			}

			const result = await originalMethod.apply(this, arguments_);
			await cacheManagerInstance.set(cacheKey, result, options.ttl);

			return result;
		};
	};
}

/**
 * Creates a cache key based on the key selector function or paths.
 */
function createCacheKey(arguments_: unknown[], keySelector: KeySelector): string {
	if (typeof keySelector === 'function') {
		const result = keySelector(...arguments_);
		return Array.isArray(result) ? result.join(':') : String(result);
	}

	if (typeof keySelector === 'string') {
		return String(get(arguments_[0] as Record<string, unknown>, keySelector));
	}

	if (Array.isArray(keySelector)) {
		return keySelector.map(path => String(get(arguments_[0] as Record<string, unknown>, path))).join(':');
	}

	throw new Error('Invalid key selector type.');
}

/**
 * Wraps and caches the original function using cache-manager and supports dynamic key selection.
 */
export function cacheFunction(
	function_: (...arguments_: unknown[]) => Promise<unknown>,
	options: CacheOptions,
): (...arguments_: unknown[]) => Promise<unknown> {
	ensureCacheInitialized(options).catch((error: unknown) => {
		console.error(error);
	});
	return async (...arguments_: unknown[]): Promise<unknown> => {
		if (!cacheManagerInstance) {
			throw new Error('Cache not initialized.');
		}

		const cacheKey = createCacheKey(arguments_, options.keySelector);
		const cachedResult = await cacheManagerInstance.get(cacheKey);
		if (cachedResult) {
			return cachedResult;
		}

		const result = await function_(...arguments_);
		await cacheManagerInstance.set(cacheKey, result, options.ttl);

		return result;
	};
}
