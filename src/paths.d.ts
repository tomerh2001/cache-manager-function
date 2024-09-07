/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';

/**
 * Represents a type that can either be a single value of type T or an array of type T.
 *
 * @typeParam T - The type of the value(s) that can be stored in the SingleOrArray.
 */
export type SingleOrArray<T> = T | T[];

/**
 * Represents any function that takes any number of arguments and returns any value.
 */
export type AnyFunction = (...arguments_: any[]) => any;

/**
 * Represents the type for generating paths of a given object.
 *
 * @template T - The type of the object.
 */
export type Paths<T> = T extends Record<string, unknown>
	? {[K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`}[keyof T]
	: T extends Array<infer U>
		? Paths<U> extends string
			? `${number}` | `${number}.${Paths<U>}`
			: never
		: never;

/**
 * Represents the paths of the arguments of a given function type.
 * @template F - The function type.
 * @typeparam F - The function type.
 * @typeparam Paths - The paths of the arguments of the function type.
 */
export type ArgumentPaths<F extends AnyFunction> = SingleOrArray<Paths<Parameters<F>>>;
