/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	type Store,
	type FactoryConfig,
	type FactoryStore,
} from 'cache-manager';

/**
 * Represents a type that can either be a single value of type T or an array of type T.
 *
 * @typeParam T - The type of the value(s) that can be stored in the SingleOrArray.
 */
export type SingleOrArray<T> = T | T[];

/**
 * Represents any function that takes any number of arguments and returns any value.
 */
export type CacheableFunction = ((...arguments_: any[]) => any) & {
	cacheOptions?: CachedFunctionOptions<any>;
};

/**
 * Represents the type for generating paths of a given object.
 *
 * @template T - The type of the object.
 * type Paths<T> = T extends Record<string, unknown> ? {[K in keyof T]:
 * `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
 * }[keyof T] : never;
*/
// TODO: Implement the Paths type.
export type Paths<T> = string; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * Represents the paths of the arguments of a given function type.
 * @template F - The function type.
 * @typeparam F - The function type.
 * @typeparam Paths - The paths of the arguments of the function type.
 */
export type ArgumentPaths<F extends CacheableFunction> = SingleOrArray<Paths<Parameters<F>>>;

/**
 * Represents the options for initializing a cached function.
 */
export type CachedFunctionInitializerOptions =
	{store: FactoryStore; config: FactoryConfig} |
	{store: Store};

/**
 * Options for a cached function.
 *
 * @template F - The type of the cacheable function.
 * @property {Partial<CachedFunctionInitializerOptions>} [options] - Additional options for the cached function.
 * @property {ArgumentPaths<F>} [selector] - The selector for the cached function.
 * @property {number} [ttl] - The time-to-live (TTL) for the cached function.
 * @property {boolean} [force] - Whether to force the execution of the cached function.
 */
export type CachedFunctionOptions<F extends CacheableFunction> = Partial<CachedFunctionInitializerOptions> & {
	selector?: ArgumentPaths<F>;
	ttl?: number;
	force?: boolean;
};
