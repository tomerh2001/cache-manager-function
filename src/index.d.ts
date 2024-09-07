import {type ArgumentPaths, type AnyFunction} from './paths.d';

export type CachedFunctionOptions<F extends AnyFunction> = {
	selector: ArgumentPaths<F>;
};
