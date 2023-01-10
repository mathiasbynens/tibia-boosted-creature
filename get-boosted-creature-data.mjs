import * as fs from 'node:fs/promises';
import { singularToPretty, pluralizedToPretty } from './normalize-names.mjs';

const getCreatureBoostInfo = async () => {
	console.log('Getting list of Tibia creatures + today’s boosted creature…');
	const response = await fetch('https://api.tibiadata.com/v3/creatures');
	const data = await response.json();
	// Note: This is technically a superset of the set of “boostable
	// creatures”. Still, it’s the closest official approximation we’ve
	// got, as far as I know.
	const boostableCreaturesUgly = data.creatures
		.creature_list
		.map(entry => entry.name)
		.sort();
	const boostableCreatures = boostableCreaturesUgly
		.map(name => pluralizedToPretty(name))
		.sort(); // Normalization might affect the sort order.
	const todaysBoostedCreature = data.creatures.boosted.name;
	return {
		boostableCreaturesUgly,
		boostableCreatures,
		todaysBoostedCreature,
	}
};

const {
	boostableCreaturesUgly,
	boostableCreatures,
	todaysBoostedCreature,
} = await getCreatureBoostInfo();

const stringify = (object) => {
	return JSON.stringify(object, null, '\t') + '\n';
};

await fs.writeFile(
	`./data/ugly-names.json`,
	stringify(boostableCreaturesUgly)
);

await fs.writeFile(
	`./data/boostable-creatures.json`,
	stringify(boostableCreatures)
);

{
	const date = new Date().toISOString().slice(0, 'yyyy-mm-dd'.length);
	const HISTORY_FILE_PATH = './data/boosted-creature-history.json';
	const json = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
	const boostedCreatureHistory = JSON.parse(json);
	if (!Object.hasOwn(boostedCreatureHistory, date)) {
		boostedCreatureHistory[date] = singularToPretty(todaysBoostedCreature);
	}
	await fs.writeFile(
		HISTORY_FILE_PATH,
		stringify(boostedCreatureHistory)
	);
}
