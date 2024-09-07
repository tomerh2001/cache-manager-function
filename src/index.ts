import _ from 'lodash';
import {type Cache, caching, type Store} from 'cache-manager';
import type {CachedFunctionInitializerOptions, CachedFunctionOptions} from './index.d';
import type {AnyFunction, ArgumentPaths} from './paths.d';

let cache: Cache | undefined;

export async function getOrInitializeCache<S extends Store>(options?: CachedFunctionInitializerOptions) {
	if (!cache && !options) {
		throw new Error('cache is not initialized and no options provided');
	}

	if (!cache && options && !('store' in options)) {
		throw new Error('Store is not provided in options but is required to initialize the cache');
	}

	cache ||= await ('config' in options! ? caching(options.store, options.config) : caching(options!.store));

	return cache as Cache<S>;
}

export function resetCache() {
	cache = undefined;
}

export function selectorToCacheKey<F extends AnyFunction>(arguments_: Parameters<F>, selector: ArgumentPaths<F>) {
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

export function cachedFunction<F extends AnyFunction>(function_: F, options: CachedFunctionOptions<F>) {
	return async (...arguments_: Parameters<F>): Promise<ReturnType<F>> => {
		const selector = options.selector ?? function_.cacheKeys ?? [];
		const cacheKey = selectorToCacheKey(arguments_, selector);
		const cache = await getOrInitializeCache(options as CachedFunctionInitializerOptions);

		const cacheValue = await cache.get<ReturnType<F>>(cacheKey);
		if (cacheValue !== undefined) {
			return cacheValue;
		}

		const result = await function_(...arguments_) as ReturnType<F>;
		await cache.set(cacheKey, result, options.ttl);

		return result;
	};
}

export function cacheKeys<F extends AnyFunction>(function_: F, ...selector: Array<ArgumentPaths<F>>) {
	const selectors = _(selector).flatMap().value();
	function_.cacheKeys = selectors;
	return function_;
}
