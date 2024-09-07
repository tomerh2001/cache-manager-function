/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	describe, it, expect, beforeEach,
} from 'bun:test';
import {memoryStore} from 'cache-manager';
import {getOrInitializeCache, selectorToCacheKey} from '../src/index';
import type {CachedFunctionInitializerOptions} from '../src/index.d';

describe('getOrInitializeCache', () => {
	beforeEach(() => {
		global.cache = undefined;
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const options = {
			config: {max: 100, ttl: 60},
		} as any;

		// eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
		await expect(getOrInitializeCache(options)).rejects.toThrow('store is required');
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
});
