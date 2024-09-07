
import _ from 'lodash';
import type {CachedFunctionOptions} from './index.d';
import type {AnyFunction, ArgumentPaths} from './paths.d';

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
