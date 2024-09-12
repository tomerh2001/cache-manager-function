/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import {
	type Cache, caching, type Store,
} from 'cache-manager';
import {
	type CachedFunctionInitializerOptions, type CachedFunctionOptions, type CacheableFunction, type ArgumentPaths,
	Logger,
} from './index.d';

let cache: Cache | undefined;
let logger: Logger = {
	info(...args: any) {},
	debug(...args: any) {},
	trace(...args: any) {},
	warn(...args: any) {},
	error(...args: any) {},
};

/**
 * Retrieves or initializes the cache.
 *
 * @template S - The type of the store.
 * @param {CachedFunctionInitializerOptions} [options] - The options for initializing the cache.
 * @returns {Promise<Cache<S>>} - A promise that resolves to the cache.
 * @throws {Error} - If the cache is not initialized and no options are provided, or if the store is not provided in the options but is required to initialize the cache.
 */
export async function getOrInitializeCache<S extends Store>(options?: CachedFunctionInitializerOptions): Promise<Cache<S>> {
	if (!cache && !options) {
		throw new Error('cache is not initialized and no options provided');
	}

	if (!cache && options && !('store' in options)) {
		throw new Error('Store is not provided in options but is required to initialize the cache');
	}

	if (options?.logger) {
		logger = options.logger as Logger;
	}

	logger?.trace('Initializing cache');
	cache ||= await ('config' in options! ? caching(options.store, options.config) : caching(options!.store));
	logger?.trace('Cache initialized');

	return cache as Cache<S>;
}

/**
 * @deprecated To close any open connections, please retrieve the cache object from `getOrInitializeCache` and close it directly.
 */
export function resetCache() {
	cache = undefined;
	logger?.warn('You have called resetCache, which is deprecated and basically does nothing. To close any open connections, please retrieve the cache object from getOrInitializeCache and close it directly.');
}

/**
 * Generates a cache key based on the provided arguments and selector.
 *
 * @template F - The type of the cacheable function.
 * @param arguments_ - The arguments of the cacheable function.
 * @param selector - The selector to determine which arguments to include in the cache key.
 * @returns The cache key generated as a string.
 * @throws {Error} If a path in the selector does not exist in the provided arguments.
 * @throws {TypeError} If a path in the selector points to a function, which is not serializable.
 */
export function selectorToCacheKey<F extends CacheableFunction>(arguments_: Parameters<F>, selector: ArgumentPaths<F>) {
	const selectors = _.castArray(selector);
	if (selectors.length === 0) {
		logger?.trace(arguments_, 'No selectors provided, using the entire arguments object as the cache key');
		return JSON.stringify(arguments_);
	}

	const values = selectors.map(path => {
		const value = _.get(arguments_, path) as unknown;
		if (value === undefined) {
			throw new Error(`Path "${path}" does not exist in the provided arguments.`);
		}

		if (typeof value === 'function' || value instanceof Function) {
			throw new TypeError(`Path "${path}" points to a function, which is not serializable.`);
		}

		return value;
	});
	const result = _.zipObject(selectors, values);
	return JSON.stringify(result);
}

/**
 * Caches the result of a function and returns the cached value if available.
 * If the cached value is not available, it executes the function and caches the result for future use.
 *
 * @template F - The type of the function to be cached.
 * @param function_ - The function to be cached.
 * @param options - Optional configuration options for the cached function.
 * @returns A promise that resolves to the result of the function.
 */
export function cachedFunction<F extends CacheableFunction>(function_: F, options?: CachedFunctionOptions<F>) {
	return async (...arguments_: Parameters<F>): Promise<ReturnType<F>> => {
		const cacheOptions = _.merge({}, options ?? {}, function_.cacheOptions ?? {});
		if (_.keys(cacheOptions).length === 0) {
			throw new Error('No cache options provided, either use the @CacheOptions decorator or provide options to cachedFunction directly.');
		}

		if (!cacheOptions.noCache) {
			logger.trace('Cache is disabled, calling the original function directly');
			return function_(...arguments_) as ReturnType<F>;
		}

		const cacheKey = selectorToCacheKey(arguments_, cacheOptions.selector!);
		const cache = await getOrInitializeCache(options as CachedFunctionInitializerOptions);

		logger?.trace({cacheKey}, 'Checking cache');
		const cacheValue = await cache.get<ReturnType<F>>(cacheKey);
		if (!cacheOptions.force && cacheValue !== undefined) {
			logger?.trace({cacheKey}, 'Cache hit');
			return cacheValue;
		}
		logger?.trace({cacheKey}, 'Cache miss');

		const result = await function_(...arguments_) as ReturnType<F>;
		logger?.trace({cacheKey}, 'Setting cache');
		await cache.set(cacheKey, result, cacheOptions.ttl);
		logger?.trace({cacheKey}, 'Cache set');

		return result;
	};
}

/**
 * Decorator for caching the result of a function based on selected arguments.
 *
 * This overload allows specifying the arguments that will be used to generate the cache key, and optionally a TTL (time to live).
 *
 * @template F - The type of the cacheable function.
 * @param {ArgumentPaths<F>} selector - The paths of the arguments to include in the cache key.
 * This specifies which function arguments will be considered when generating the cache key.
 * @param {number} [ttl] - Optional time to live (TTL) in seconds for the cached value.
 * If not provided, the cached value will persist until it is evicted based on the cache settings.
 * @returns {Function} A decorator function that adds caching options to the method's descriptor.
 */
export function CacheOptions<F extends CacheableFunction>(selector: ArgumentPaths<F>, ttl?: number): any;

/**
 * Decorator for caching the result of a function.
 *
 * This overload allows providing a complete configuration object that specifies all caching behaviors,
 * including which arguments to use for the cache key, the TTL, etc.
 *
 * @template F - The type of the cacheable function.
 * @param {CachedFunctionOptions<F>} options - The full configuration options for caching the function.
 */
export function CacheOptions<F extends CacheableFunction>(options: CachedFunctionOptions<F>): any;

export function CacheOptions<F extends CacheableFunction>(
	selectorOrOptions: ArgumentPaths<F> | CachedFunctionOptions<F>,
	ttl?: number,
): any {
	const options = (_.isArrayLike(selectorOrOptions) || _.isString(selectorOrOptions))
		? {selector: selectorOrOptions, ttl}
		: selectorOrOptions as CachedFunctionOptions<F>;

	return (
		_target: any,
		_propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<F>,
	): any => {
		if (!descriptor.value) {
			logger?.warn('CacheOptions decorator is only supported on methods');
			return;
		}

		descriptor.value.cacheOptions = options;
		return descriptor;
	};
}
