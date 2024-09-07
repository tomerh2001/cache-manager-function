
import type {CachedFunctionOptions} from './index.d';
import type {AnyFunction} from './paths.d';

export function cachedFunction<F extends AnyFunction>(function_: F, options: CachedFunctionOptions<F>) {
	console.log(options);
	return function_;
}

/** TEST */
type Person = {
	name: string;
	age: number;
	address: {
		city: string;
		zip: number;
	};
};

const person: Person = {
	name: 'John Doe',
	age: 30,
	address: {
		city: 'New York',
		zip: 10_001,
	},
};

cachedFunction((person: Person) => person.name, {
	selector: person => person.name,
});
