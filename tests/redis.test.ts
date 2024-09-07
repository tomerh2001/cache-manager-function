/* eslint-disable @typescript-eslint/unbound-method */
import {random} from 'lodash';
import {type RedisStore, redisStore} from 'cache-manager-ioredis-yet';
import {cachedFunction, CacheOptions, getOrInitializeCache} from '../src';

const cache = await getOrInitializeCache<RedisStore>({
	store: await redisStore({
		host: 'localhost',
		port: 6379,
	}),
});

type Person = {
	id?: string;
	name: string;
	age: number;
	address: {
		street: string;
		city: string;
	};
};

class CachedPersonCreator {
	@CacheOptions('0.name', 10_000)
	static async createPerson(person: Person) {
		console.log('Person created!!!!!');
		return person;
	}
}

const cachedCreatePerson = cachedFunction(CachedPersonCreator.createPerson);
const person = await cachedCreatePerson({
	id: random(0, 100_000).toString(),
	name: 'Tomer Horowitz',
	age: 23,
	address: {
		street: '123 Main St.',
		city: 'Springfield',
	},
});
console.log(person.id, person.name);

await cache.store.client.quit();
