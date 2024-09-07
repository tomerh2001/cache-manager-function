import {test, expect} from 'bun:test';
import {selectorToCacheKey} from '../src/index';
import type {ArgumentPaths} from '../src/paths.d';

type TestFunction = (a: {x: number; y: string}, b: number) => string;

test('selectorToCacheKey should generate correct cache key', () => {
	const arguments_: Parameters<TestFunction> = [{x: 42, y: 'hello'}, 100];

	const selectorSingle: ArgumentPaths<TestFunction> = '0.x';
	const expectedSingleKey = JSON.stringify({'0.x': 42});
	const resultSingle = selectorToCacheKey(arguments_, selectorSingle);
	expect(resultSingle).toBe(expectedSingleKey);

	const selectorMultiple: ArgumentPaths<TestFunction> = ['0.x', '0.y'];
	const expectedMultipleKey = JSON.stringify({'0.x': 42, '0.y': 'hello'});
	const resultMultiple = selectorToCacheKey(arguments_, selectorMultiple);
	expect(resultMultiple).toBe(expectedMultipleKey);

	const selectorArray: ArgumentPaths<TestFunction> = ['0.x', '1'];
	const expectedArrayKey = JSON.stringify({'0.x': 42, 1: 100});
	const resultArray = selectorToCacheKey(arguments_, selectorArray);
	expect(resultArray).toBe(expectedArrayKey);
});
