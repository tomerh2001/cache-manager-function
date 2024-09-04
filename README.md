# cache-manager-function

`cache-manager-function` is a vertical integration library that extends `cache-manager` to provide easy-to-use function-level caching with support for Redis and other stores. It allows you to cache function results with decorators, automatic cache initialization, and customizable cache key selection strategies.

## Features

- **Function Caching**: Easily cache async functions to improve performance.
- **Class Method Caching**: Use decorators to add caching to class methods.
- **Custom Key Selection**: Dynamically generate cache keys using functions, strings, or paths.
- **TTL Management**: Set cache expiration times to keep your data fresh.
- **Seamless Integration**: Built on top of `cache-manager` for reliable and configurable caching.

## Installation

```shell
npm install cache-manager-function cache-manager cache-manager-redis-store
```

## Usage

### 1. Initialize Cache Manager

Before using caching, initialize the cache manager with your desired configuration. By default, it uses Redis as the cache store.

```typescript
import { initializeCache } from 'cache-manager-function';

await initializeCache({
  host: 'localhost',
  port: 6379,
  ttl: 60, // Time-to-live in seconds
});
```

### 2. Caching Functions with `cacheFunction`

Wrap your async functions with `cacheFunction` to automatically cache their results.

```typescript
import { cacheFunction } from 'cache-manager-function';

async function fetchData(id) {
  // Fetch data logic
}

const cachedFetchData = cacheFunction(fetchData, {
  ttl: 120,
  keySelector: ['id'],
});

const result = await cachedFetchData(123);
```

### 3. Using `@cache` Decorator for Class Methods

Use the `@cache` decorator to cache class methods with customizable TTL and key selection.

```typescript
import { cache } from 'cache-manager-function';

class DataService {
  @cache({ ttl: 180, keySelector: 'id' })
  async getData(id) {
    // Fetch data logic
  }
}

const service = new DataService();
const data = await service.getData(123);
```

### 4. Using `@cacheMeta` for Metadata

The `@cacheMeta` decorator sets up metadata for caching, specifying how cache keys and TTLs are handled. This metadata can be used by other mechanisms to manage caching behavior.

```typescript
import { cacheMeta } from 'cache-manager-function';

class UserService {
  @cacheMeta({ ttl: 60, keySelector: ['userId'] })
  async getUser(userId) {
    // Method logic
  }
}
```

## API

### `initializeCache(config: CacheInitializationConfig): Promise<void>`

Initializes the cache manager with the specified configuration.

- **config**: Configuration object with optional `host`, `port`, `password`, and required `ttl`.

### `cacheFunction(function_, options): Function`

Wraps and caches an async function based on the provided options.

- **function_**: The function to be cached.
- **options**: Configuration options including `ttl` and `keySelector`.

### `@cache(options: CacheOptions)`

A decorator to cache class methods.

- **options**: Configuration object with `ttl` and `keySelector`.

### `@cacheMeta(options: CacheOptions)`

Adds caching metadata to methods for defining cache keys and TTL without direct caching.

- **options**: Configuration object with `ttl` and `keySelector`.

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.