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
 * Represents a logger object.
 */
export type Logger = {
	trace: (...arguments_: any) => any;
	debug: (...arguments_: any) => any;
	info: (...arguments_: any) => any;
	warn: (...arguments_: any) => any;
	error: (...arguments_: any) => any;
};

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
export type CachedFunctionInitializerOptions = {logger?: Partial<Logger>} &
({store: FactoryStore; config: FactoryConfig} | {store: Store});

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
	/** The selector for the cached function. */
	selector?: ArgumentPaths<F>;
	/** The time-to-live (TTL) for the cached function. */
	ttl?: number;
	/** Whether to force update the cache. */
	force?: boolean;
	/** Don't use the cache at all - when `true`, calls to functions wrapped by `cachedFunction` will essentially just call the original function. */
	noCache?: boolean;
	/**
	 * This can be used to namespace the keys in the cache.
	 *
	 * Will be inserted into the key object as `{namespace: value}`.
	 */
	namespace?: string;
	/**
	 * If set to `true`, the function will return the raw value (either from the cache or the function call),
	 * instead of the `CachedFunctionResult` object.
	 */
	returnRawValue?: boolean;
};

export type CacheStatus = 'hit' | 'miss';
export type CachedFunctionResult<T> = {
	/**
	 * The options used to cache the function.
	 */
	options: CachedFunctionOptions<CacheableFunction>;
	/**
	 * The status of the cache.
	 * - `'hit'` - The cache was found.
	 * - `'miss'` - The cache was not found.
	*/
	status?: CacheStatus;
	/**
	 * The cache key used to store the value.
	 */
	key?: string;
	/**
	 * The result returned by the function/cache.
	 */
	result: T;
	/**
	 * Whether the cache `set` operation was called.
	 */
	created: boolean;
};
