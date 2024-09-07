# Cache Manager Function

A TypeScript utility package to easily cache function results using `cache-manager`. It provides a set of functions and decorators to cache the output of functions and retrieve results from the cache for faster performance.

## Features

- **Easy cache initialization**: Automatically manages cache initialization and configuration.
- **Flexible caching**: Allows fine-grained control over cache key generation and TTL (time-to-live).
- **Decorator support**: Simplify caching configurations with the `@CacheOptions` decorator.

## Installation

To install the package, use npm or yarn:

```bash
npm install cache-manager-function
# or
yarn add cache-manager-function
```

## Usage

### Initialize Cache

Before using the caching functions, you need to initialize the cache.

```typescript
import { getOrInitializeCache } from `cache-manager-function`;

// Initialize the cache with your store and configuration options.
await getOrInitializeCache({
  store: { create: () => /* your store logic */ },
  config: { ttl: 60 },
});
```

### Caching a Function

You can cache the result of a function using the `cachedFunction` wrapper.

```typescript
import { cachedFunction } from `cache-manager-function`;

// Define a function you want to cache
async function fetchData(id: number): Promise<string> {
  // Simulate an API call or some expensive operation
  return `Data for ${id}`;
}

// Create a cached version of the function
const cachedFetchData = cachedFunction(fetchData, {
  selector: [`0`], // Cache key based on the first argument (id)
  ttl: 120,        // Cache the result for 120 seconds
});

// Use the cached function
const data = await cachedFetchData(1);
console.log(data); // Outputs: `Data for 1`
```

### Using the CacheOptions Decorator

You can specify caching options directly on the function using the `@CacheOptions` decorator.

```typescript
import { CacheOptions, cachedFunction } from `cache-manager-function`;

class DataService {
  @CacheOptions([`0`], 180) // Cache for 180 seconds based on the first argument
  async getData(id: number): Promise<string> {
    return `Service Data for ${id}`;
  }
}

const service = new DataService();
const cachedGetData = cachedFunction(service.getData.bind(service));
const result = await cachedGetData(2);
console.log(result); // Outputs: `Service Data for 2`
```

## API

### `getOrInitializeCache(options?: CachedFunctionInitializerOptions)`

Retrieves or initializes the cache. Throws an error if the cache is not initialized and no options are provided.

- `options`: Configuration for initializing the cache.

### `cachedFunction(function_, options?)`

Caches the result of a function. Returns the cached value if available, otherwise executes the function and caches the result.

- `function_`: The function to cache.
- `options`: Configuration options for caching.

### `CacheOptions(selectorOrOptions, ttl?)`

A decorator that specifies caching options for the function.

- `selectorOrOptions`: Selector or options for caching.
- `ttl`: Time-to-live in seconds.

## License

MIT License.