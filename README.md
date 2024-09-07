# cache-manager-function
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![XO code style](https://shields.io/badge/code_style-5ed9c7?logo=xo&labelColor=gray)](https://github.com/xojs/xo)
[![Snyk Security](../../actions/workflows/snyk-security.yml/badge.svg)](../../actions/workflows/snyk-security.yml)
[![CodeQL](../../actions/workflows/codeql.yml/badge.svg)](../../actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/tomerh2001/semantic-release-repo-template/badge)](https://securityscorecards.dev/viewer/?uri=github.com/tomerh2001/semantic-release-repo-template)

Cache the outputs of functions based on their arguments using `cache-manager`.

## Installation

Install the package using npm:

```bash
npm install cache-manager-function
```

or with Yarn:

```bash
yarn add cache-manager-function
```

## Usage

### 1. Initialize

Call `getOrInitializeCache` to manually initialize the cache.

```typescript
const cache = await getOrInitializeCache<RedisStore>({
  store: await redisStore({
    host: 'localhost',
    port: 6379,
  }),
});
```

Alternatively, you can initialize the cache implicitly by providing the store directly to `cachedFunction`.

```typescript
const multiply = (x, y) => x * y;

const cachedMultiply = cachedFunction(multiply, {
  store: await redisStore({
    host: 'localhost',
    port: 6379,
  }),
});

// Initializes the cache and caches the result
await cachedMultiply(2, 3); 
```

### 2. Caching with `cachedFunction`

The `selector` option specifies which arguments should be used to generate the cache key.

```typescript
type Person = { name: string; lastname: string };

const greet = (person: Person) => `Hello, ${person.name} ${person.lastname}!`;

// Caches based on `person.name` and `person.lastname`
const cachedGreet = cachedFunction(greet, {
  selector: ['0.name', '0.lastname']
});

await cachedGreet({ person: { name: `John`, lastname: `Doe` } }); // Caches the result based on name=John and lastname=Doe
await cachedGreet({ person: { name: `Jane`, lastname: `Doe` } }); // Caches the result based on name=Jane and lastname=Doe
```

### 3. Using the `CacheOptions` decorator

`CacheOptions` receives the exact same options that `cachedFunction` receives. It’s an alternative way to define the cache behavior directly on the function.

```typescript
import { CacheOptions, cachedFunction } from `cache-manager-function`;

class UserService {
  @CacheOptions(['0'], 300) // Specifies to cache based on the first argument (id), with a TTL of 300ms
  async getUser(id: number) {
    return `User with ID: ${id}`;
  }
}

const service = new UserService();
const cachedFetchUser = cachedFunction(service.getUser);

await userService.getUser(1); // Executes and caches based on the `id` argument
await userService.getUser(1); // Returns the cached result
```

## API

### getOrInitializeCache

Initializes or retrieves the cache.

- **Parameters:**
  - `options` (Optional): Configuration options to initialize the cache.

- **Returns:** A promise that resolves to the cache instance.

### cachedFunction

Caches the result of a function based on its arguments.

- **Parameters:**
  - `function_`: The function to cache.
  - `options` (Optional): Configuration options for caching.

- **Returns:** A cached function that returns a promise with the result.

### CacheOptions

Decorator to cache function results based on selected arguments.

- **Parameters:**
  - `selector`: Paths of the arguments to include in the cache key.
  - `ttl` (Optional): Time-to-live for the cached result.

## License

MIT License. See the LICENSE file for more details.