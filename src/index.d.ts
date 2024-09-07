import {
	type Store,
	type FactoryConfig,
	type FactoryStore,
} from 'cache-manager';
import {type ArgumentPaths, type AnyFunction} from './paths.d';

export type CachedFunctionInitializerOptions =
	{store: FactoryStore; config: FactoryConfig} |
	{store: Store};

export type CachedFunctionOptions<F extends AnyFunction> = CachedFunctionInitializerOptions & {
	selector: ArgumentPaths<F>;
	ttl?: number;
};
