
import {test, expect} from 'bun:test';
import {
	initializeCache,
	ensureCacheInitialized,
	cacheMeta,
	cache,
	createCacheKey,
	cacheFunction,
	type CacheInitializationConfig,
} from '../src/index';

const testConfig: CacheInitializationConfig = {
	host: '127.0.0.1',
	port: 6379,
	ttl: 300,
};

test('initializeCache initializes cache manager with correct configuration', async () => {
	await initializeCache(testConfig);

	expect(globalThis.cacheManagerInstance).toBeDefined();
});

test('ensureCacheInitialized initializes cache if not initialized', async () => {
	globalThis.cacheManagerInstance = undefined;
	await ensureCacheInitialized(testConfig);
	expect(globalThis.cacheManagerInstance).toBeDefined();
});

test('ensureCacheInitialized does not initialize cache if already initialized', async () => {
	globalThis.cacheManagerInstance = {get: async () => 'mocked'} as any;
	await ensureCacheInitialized(testConfig);
	expect(globalThis.cacheManagerInstance.get).toBeDefined();
});

test('createCacheKey generates key correctly based on keySelector function', () => {
	const keySelector = (a: number, b: number) => [a, b];
	const key = createCacheKey([1, 2], keySelector);
	expect(key).toBe('1:2');
});

test('createCacheKey generates key correctly based on string selector', () => {
	const key = createCacheKey([{name: 'test'}], 'name');
	expect(key).toBe('test');
});

test('createCacheKey generates key correctly based on array of selectors', () => {
	const key = createCacheKey([{name: 'test', age: 25}], ['name', 'age']);
	expect(key).toBe('test:25');
});

test('cacheMeta sets metadata correctly', async () => {
	const options = {ttl: 300, keySelector: 'name'};
	const target = {};
	const propertyKey = 'testMethod';

	await cacheMeta(options)(target, propertyKey);

	expect(Reflect.getMetadata('cacheKeySelector', target, propertyKey)).toBe('name');
	expect(Reflect.getMetadata('cacheTtl', target, propertyKey)).toBe(300);
});

test('cache decorator caches function results', async () => {
	await initializeCache(testConfig);
	const options = {ttl: 300, keySelector: 'name'};
	const target = {};
	const descriptor = {
		async value() {
			return 'result';
		},
	} as PropertyDescriptor;

	cache(options)(target, 'testMethod', descriptor);

	const result = await descriptor.value({name: 'test'});

	const cachedResult = await globalThis.cacheManagerInstance!.get('test');

	expect(result).toBe('result');
	expect(cachedResult).toBe('result');
});

test('cacheFunction caches results correctly', async () => {
	await initializeCache(testConfig);
	const options = {ttl: 300, keySelector: 'name'};
	const originalFunction = async () => 'result';

	const wrappedFunction = cacheFunction(originalFunction, options);
	const result = await wrappedFunction({name: 'test'});

	const cachedResult = await globalThis.cacheManagerInstance!.get('test');

	expect(result).toBe('result');
	expect(cachedResult).toBe('result');
});
