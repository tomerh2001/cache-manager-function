import {random} from 'lodash';
import {type RedisStore, redisStore} from 'cache-manager-ioredis-yet';
import {cachedFunction, getOrInitializeCache, resetCache} from '../src';

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
	person.id = random(0, 100_000).toString();
	console.log('Person created!!!!!');
	return person;
}

const cache = await getOrInitializeCache<RedisStore>({
	store: await redisStore(),
});
const cachedCreatePerson = cachedFunction(createPerson, {
	selector: '0.id',
	ttl: 10_000,
});

const person = await cachedCreatePerson({
	name: 'Tomer Horowitz',
	age: 23,
	address: {
		street: '123 Main St.',
		city: 'Springfield',
	},
});
console.log(person.id, person.name);

