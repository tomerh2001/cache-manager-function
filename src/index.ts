
/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';
import {
	type Cache, caching, type Store,
} from 'cache-manager';
import type {CachedFunctionInitializerOptions, CachedFunctionOptions} from './index.d';
import type {AnyFunction as CacheableFunction, ArgumentPaths} from './paths.d';

let cache: Cache | undefined;

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

	cache ||= await ('config' in options! ? caching(options.store, options.config) : caching(options!.store));

	return cache as Cache<S>;
}

/**
 * @deprecated To close any open connections, please retrieve the cache object from `getOrInitializeCache` and close it directly.
 */
export function resetCache() {
	cache = undefined;
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

		const cacheKey = selectorToCacheKey(arguments_, cacheOptions.selector!);
		const cache = await getOrInitializeCache(options as CachedFunctionInitializerOptions);

		const cacheValue = await cache.get<ReturnType<F>>(cacheKey);
		if (!cacheOptions.force && cacheValue !== undefined) {
			return cacheValue;
		}

		const result = await function_(...arguments_) as ReturnType<F>;
		await cache.set(cacheKey, result, cacheOptions.ttl);

		return result;
	};
}

/**
 * Specify the options used when `cachedFunction` is invoked with this function.
 * The decorator arguments take precedence over the options provided to `cachedFunction`.
 *
 * @template F - The type of the cacheable function.
 * @param {ArgumentPaths<F> | CachedFunctionOptions<F>} selectorOrOptions - The selector or options for caching.
 * @param {number} [ttl] - The time-to-live (TTL) for the cache.
 * @returns {any} - The modified descriptor object.
 */
export function CacheOptions<F extends CacheableFunction>( // eslint-disable-line @typescript-eslint/naming-convention
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
			return;
		}

		descriptor.value.cacheOptions = options;
		return descriptor;
	};
}
