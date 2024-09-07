import {random} from 'lodash';
import {type RedisStore, redisStore} from 'cache-manager-ioredis-yet';
import {cachedFunction, getOrInitializeCache} from '../src';

type Person = {
	id?: string;
	name: string;
	age: number;
	address: {
		street: string;
		city: string;
	};
};

async function createPerson(person: Person) {
	console.log('Person created!!!!!');
	return person;
}

const cache = await getOrInitializeCache<RedisStore>({
	store: await redisStore({
		host: 'localhost',
		port: 6379,
	}),
});
const cachedCreatePerson = cachedFunction(createPerson, {
	selector: '0.name',
	ttl: 1000,
});

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
