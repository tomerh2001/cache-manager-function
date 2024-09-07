import _ from 'lodash';
import {type Cache, caching} from 'cache-manager';
import type {CachedFunctionInitializerOptions, CachedFunctionOptions} from './index.d';
import type {AnyFunction, ArgumentPaths} from './paths.d';

let cache: Cache | undefined;

export async function initializeCache(options?: CachedFunctionInitializerOptions) {
	if (!cache && !options) {
		throw new Error('cache is not initialized and no options provided');
	}

	if (options && !('store' in options)) {
		throw new Error('store is required');
	}

	cache ||= await ('config' in options! ? caching(options.store, options.config) : caching(options!.store));
	return cache;
}

export function resetCache() {
	cache = undefined;
}

export function selectorToCacheKey<F extends AnyFunction>(arguments_: Parameters<F>, selector: ArgumentPaths<F>) {
	const selectors = _.castArray(selector);
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

export function cachedFunction<F extends AnyFunction>(function_: F, options: CachedFunctionOptions<F>) {
	return async (...arguments_: Parameters<F>): Promise<ReturnType<F>> => {
		const cacheKey = selectorToCacheKey(arguments_, options.selector);

		const cache = await initializeCache(options);

		const cacheValue = await cache.get<ReturnType<F>>(cacheKey);
		if (cacheValue !== undefined) {
			return cacheValue;
		}

		const result = await function_(...arguments_) as ReturnType<F>;
		await cache.set(cacheKey, result, options.ttl);

		return result;
	};
}
