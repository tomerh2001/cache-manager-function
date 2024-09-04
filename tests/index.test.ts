import 'reflect-metadata'; // eslint-disable-line import/no-unassigned-import
import {
	expect, describe, it, afterEach,
	mock,
} from 'bun:test';
import cacheManager, {type Cache} from 'cache-manager';
import {redisStore} from 'cache-manager-redis-store';
import {
	cache, cacheMeta, cacheFunction, initializeCache, ensureCacheInitialized,
} from '../src/index';

mock(cacheManager.caching, function_ => ({
	async caching(config) {
		return mockCacheManagerInstance;
	},
}));
mock(redisStore, () => jest.fn());

const mockCacheManagerInstance: Partial<Cache> = {
	get: mock(async () => null),
	set: mock(async () => undefined),
};

describe('Cache Manager Functions', () => {
	afterEach(() => {
		mockCacheManagerInstance.get.mockClear();
		mockCacheManagerInstance.set.mockClear();
	});

	describe('initializeCache', () => {
		it('should initialize cache with given config', async () => {
			await initializeCache({host: 'localhost', port: 6379, ttl: 100});

			expect(cacheManager.caching).toHaveBeenCalledWith({
				store: redisStore,
				host: 'localhost',
				port: 6379,
				password: undefined,
				ttl: 100,
			});
		});
	});

	describe('ensureCacheInitialized', () => {
		it('should initialize cache if not already initialized', async () => {
			await ensureCacheInitialized({ttl: 200});

			expect(cacheManager.caching).toHaveBeenCalled();
		});

		it('should not initialize cache if already initialized', async () => {
			await initializeCache({ttl: 200});
			await ensureCacheInitialized({ttl: 200});

			expect(cacheManager.caching).toHaveBeenCalledTimes(1);
		});
	});

	describe('cacheMeta', () => {
		it('should define cache metadata correctly', async () => {
			const target = {};
			const propertyKey = 'testFunction';

			await cacheMeta({ttl: 300, keySelector: 'key.path'})(target, propertyKey);

			expect(Reflect.getMetadata('cacheKeySelector', target, propertyKey)).toEqual('key.path');
			expect(Reflect.getMetadata('cacheTtl', target, propertyKey)).toEqual(300);
		});
	});

	describe('cache', () => {
		it('should cache the result of the decorated function', async () => {
			const target = {};
			const propertyKey = 'cachedMethod';
			const originalMethod = mock(async () => 'result');
			const descriptor = {
				value: originalMethod,
			};

			cache({ttl: 400, keySelector: 'id'})(target, propertyKey, descriptor);

			mockCacheManagerInstance.get.mockResolvedValueOnce(null);

			const result = await descriptor.value.apply({}, [{id: 1}]);

			expect(originalMethod).toHaveBeenCalledWith({id: 1});
			expect(mockCacheManagerInstance.set).toHaveBeenCalledWith(expect.any(String), 'result', 400);
			expect(result).toEqual('result');
		});

		it('should return cached result if available', async () => {
			const target = {};
			const propertyKey = 'cachedMethod';
			const originalMethod = mock(async () => 'should not be called');
			const descriptor = {
				value: originalMethod,
			};

			cache({ttl: 400, keySelector: 'id'})(target, propertyKey, descriptor);

			mockCacheManagerInstance.get.mockResolvedValueOnce('cachedResult');

			const result = await descriptor.value.apply({}, [{id: 1}]);

			expect(originalMethod).not.toHaveBeenCalled();
			expect(result).toEqual('cachedResult');
		});
	});

	describe('cacheFunction', () => {
		it('should cache the result of the function', async () => {
			const function_ = mock(async () => 'computedValue');
			const wrappedFunction = cacheFunction(function_, {ttl: 500, keySelector: 'name'});

			mockCacheManagerInstance.get.mockResolvedValueOnce(null);

			const result = await wrappedFunction({name: 'test'});

			expect(function_).toHaveBeenCalledWith({name: 'test'});
			expect(mockCacheManagerInstance.set).toHaveBeenCalledWith(expect.any(String), 'computedValue', 500);
			expect(result).toEqual('computedValue');
		});

		it('should return cached result if available', async () => {
			const function_ = mock(async () => 'should not be called');
			const wrappedFunction = cacheFunction(function_, {ttl: 500, keySelector: 'name'});

			mockCacheManagerInstance.get.mockResolvedValueOnce('cachedValue');

			const result = await wrappedFunction({name: 'test'});

			expect(function_).not.toHaveBeenCalled();
			expect(result).toEqual('cachedValue');
		});
	});
});
