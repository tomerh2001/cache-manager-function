/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	describe, it, expect, beforeEach,
} from 'bun:test';
import {memoryStore} from 'cache-manager';
import {
	getOrInitializeCache, selectorToCacheKey, cachedFunction, resetCache,
} from '../src/index';
import type {CachedFunctionInitializerOptions, CachedFunctionOptions} from '../src/index.d';

describe('initializeCache', () => {
	beforeEach(() => {
		resetCache();
	});

	it('should initialize cache with config when options include config', async () => {
		const options: CachedFunctionInitializerOptions = {
			store: memoryStore(),
			config: {max: 100, ttl: 60},
		};

		const result = await getOrInitializeCache(options);

		expect(result).toBeDefined();
		expect(result.store).toBeDefined();
	});

	it('should initialize cache without config when options do not include config', async () => {
		const options: CachedFunctionInitializerOptions = {
			store: memoryStore(),
		};

		const result = await getOrInitializeCache(options);

		expect(result).toBeDefined();
		expect(result.store).toBeDefined();
	});

	it('should reuse the initialized cache', async () => {
		const options: CachedFunctionInitializerOptions = {
			store: memoryStore(),
		};

		const firstInit = await getOrInitializeCache(options);
		const secondInit = await getOrInitializeCache(options);

		expect(firstInit).toBe(secondInit);
	});

	it('should throw an error if store is not provided', async () => {
		const options = {
			config: {max: 100, ttl: 60},
		} as any;

		await expect(getOrInitializeCache(options)).rejects.toThrow('Store is not provided in options but is required to initialize the cache');
	});

	it('should throw an error if cache is not initialized and no options are provided', async () => {
		resetCache();
		await expect(getOrInitializeCache()).rejects.toThrow('cache is not initialized and no options provided');
	});

	it('should initialize cache only once, even with multiple config calls', async () => {
		const options: CachedFunctionInitializerOptions = {
			store: memoryStore(),
			config: {max: 100, ttl: 60},
		};

		const firstCall = await getOrInitializeCache(options);
		const secondCall = await getOrInitializeCache();

		expect(firstCall).toBe(secondCall);
	});
});

describe('selectorToCacheKey', () => {
	it('should generate a cache key for a single argument path', () => {
		const arguments_ = [{id: 1, name: 'test'}];
		const selector = '0.id';
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{"0.id":1}');
	});

	it('should generate a cache key for multiple argument paths', () => {
		const arguments_ = [{id: 1, name: 'test'}, {value: 'data'}];
		const key = selectorToCacheKey(arguments_, ['0.id', '1.value']);

		expect(key).toBe('{"0.id":1,"1.value":"data"}');
	});

	it('should handle empty selectors and arguments', () => {
		const arguments_: any = [];
		const selector: any = [];
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{}');
	});

	it('should throw an error for non-existent paths', () => {
		const arguments_ = [{id: 1}];
		const selector = '0.nonExistent';

		expect(() => selectorToCacheKey(arguments_, selector)).toThrow(
			'Path "0.nonExistent" does not exist in the provided arguments.',
		);
	});

	it('should handle deeply nested objects', () => {
		const arguments_ = [{nested: {id: 42}}];
		const selector = '0.nested.id';
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{"0.nested.id":42}');
	});

	it('should handle array paths correctly', () => {
		const arguments_ = [[{id: 1}, {id: 2}]];
		const selector = '0[1].id';
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{"0[1].id":2}');
	});

	it('should throw for invalid selectors', () => {
		const arguments_ = [{id: 1}];
		const selector = 'invalid.selector';

		expect(() => selectorToCacheKey(arguments_, selector)).toThrow(
			'Path "invalid.selector" does not exist in the provided arguments.',
		);
	});

	it('should handle special characters in paths', () => {
		const arguments_ = [{'key.with.dot': {value: 5}}];
		const selector = '0["key.with.dot"].value';
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{"0[\\"key.with.dot\\"].value":5}');
	});

	it('should handle large nested structures without performance degradation', () => {
		const largeObject = Array.from({length: 10_000}, (_, i) => ({id: i}));

		const selector = '5000.id';
		const key = selectorToCacheKey(largeObject, selector);

		expect(key).toBe('{"5000.id":5000}');
	});

	it('should handle empty selectors with non-empty arguments', () => {
		const arguments_ = [{id: 1}];
		const selector: any = [];
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{}');
	});

	it('should handle paths that skip levels correctly', () => {
		const arguments_ = [{level1: {level3: {id: 7}}}];
		const selector = '0.level1.level3.id';
		const key = selectorToCacheKey(arguments_, selector);

		expect(key).toBe('{"0.level1.level3.id":7}');
	});

	it('should throw an error if selector points to a function', () => {
		const arguments_ = [{func() {}}];
		const selector = '0.func';

		expect(() => selectorToCacheKey(arguments_, selector)).toThrow(
			'Path "0.func" points to a function, which is not serializable.',
		);
	});
});

describe('cachedFunction', () => {
	let testCacheOptions: CachedFunctionOptions<(id: number) => Promise<{id: number; name: string}>>;

	beforeEach(() => {
		resetCache();
		testCacheOptions = {
			selector: '0',
			ttl: 60,
			store: memoryStore(),
		};
	});

	it('should call the original function if the result is not cached', async () => {
		let callCount = 0;
		const testFunction = async (id: number) => {
			callCount++;
			return {id, name: 'test'};
		};

		const cachedFunction_ = cachedFunction(testFunction, testCacheOptions);

		const result = await cachedFunction_(1);

		expect(result).toEqual({id: 1, name: 'test'});
		expect(callCount).toBe(1);
	});

	it('should return the cached value if available', async () => {
		let callCount = 0;
		const testFunction = async (id: number) => {
			callCount++;
			return {id, name: 'test'};
		};

		const cachedFunction_ = cachedFunction(testFunction, testCacheOptions);

		await cachedFunction_(1);
		const result = await cachedFunction_(1);

		expect(result).toEqual({id: 1, name: 'test'});
		expect(callCount).toBe(1);
	});

	it('should work with multiple arguments', async () => {
		const multiArgumentFunction = async (a: number, b: number) => a + b;
		const multiArgumentCacheOptions: CachedFunctionOptions<typeof multiArgumentFunction> = {
			selector: ['0', '1'],
			ttl: 60,
			store: memoryStore(),
		};
		resetCache();
		const cachedFunction_ = cachedFunction(multiArgumentFunction, multiArgumentCacheOptions);

		const result = await cachedFunction_(1, 2);

		expect(result).toBe(3);

		const cachedResult = await cachedFunction_(1, 2);

		expect(cachedResult).toBe(3);
	});

	it('should throw if an error occurs in the original function', async () => {
		const errorFunction = async () => {
			throw new Error('Test error');
		};

		const errorCacheOptions: CachedFunctionOptions<typeof errorFunction> = {
			selector: [],
			ttl: 60,
			store: memoryStore(),
		};
		resetCache();
		const cachedFunction_ = cachedFunction(errorFunction, errorCacheOptions);

		await expect(cachedFunction_()).rejects.toThrow('Test error');
	});

	it('should cache results separately for different argument values', async () => {
		let callCount = 0;
		const testFunction = async (id: number) => {
			callCount++;
			return {id, name: `test${id}`};
		};

		const cachedFunction_ = cachedFunction(testFunction, testCacheOptions);

		const result1 = await cachedFunction_(1);
		const result2 = await cachedFunction_(2);

		expect(result1).toEqual({id: 1, name: 'test1'});
		expect(result2).toEqual({id: 2, name: 'test2'});
		expect(callCount).toBe(2);
	});

	it('should cache results even when called with complex objects as arguments', async () => {
		let callCount = 0;
		const testFunction = async (object: {id: number; value: string}) => {
			callCount++;
			return {id: object.id, name: object.value};
		};

		const complexCacheOptions: CachedFunctionOptions<typeof testFunction> = {
			selector: '0.id',
			ttl: 60,
			store: memoryStore(),
		};

		const cachedFunction_ = cachedFunction(testFunction, complexCacheOptions);

		const result = await cachedFunction_({id: 1, value: 'test'});

		expect(result).toEqual({id: 1, name: 'test'});
		expect(callCount).toBe(1);

		const cachedResult = await cachedFunction_({id: 1, value: 'test'});

		expect(cachedResult).toEqual({id: 1, name: 'test'});
		expect(callCount).toBe(1);
	});
});
