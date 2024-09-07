
import _ from 'lodash';
import {type Cache, caching} from 'cache-manager';
import type {CachedFunctionInitializerOptions, CachedFunctionOptions} from './index.d';
import type {AnyFunction, ArgumentPaths} from './paths.d';

let cache: Cache | undefined;

export async function getOrInitializeCache(options: CachedFunctionInitializerOptions) {
	if (!('store' in options)) {
		throw new Error('store is required');
	}

	cache ||= await ('config' in options ? caching(options.store, options.config) : caching(options.store));
	return cache;
}

export function selectorToCacheKey<F extends AnyFunction>(arguments_: Parameters<F>, selector: ArgumentPaths<F>) {
	const selectors = _.castArray(selector);
	const values = _.at(arguments_, selectors);
	const result = _.zipObject(selectors, values);
	return JSON.stringify(result);
}

export function cachedFunction<F extends AnyFunction>(function_: F, options: CachedFunctionOptions<F>) {
	return (...arguments_: Parameters<F>): ReturnType<F> => {
		const cacheKey = selectorToCacheKey(arguments_, options.selector);
		console.log({cacheKey});
		return function_(...arguments_);
	};
}
