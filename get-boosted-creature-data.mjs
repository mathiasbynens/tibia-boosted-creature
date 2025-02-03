import * as fs from 'node:fs/promises';
import { singularToPretty, pluralizedToPretty } from './normalize-names.mjs';

// Creatures that have historically been boosted despite not appearing
// on https://www.tibia.com/library/?subtopic=creatures.
const SPECIAL_CASES = [
	{
		uglyPluralName: 'Ragged Rabid Wolves',
		prettySingularName: 'ragged rabid wolf',
	},
];

const getCreatureBoostInfo = async () => {
	console.log('Getting list of Tibia creatures + today’s boosted creature…');
	const response = await fetch('https://api.tibiadata.com/v4/creatures');
	const data = await response.json();
	// Note: This is technically a superset of the set of “boostable
	// creatures”. Still, it’s the closest official approximation we’ve
	// got, as far as I know.
	const boostableCreaturesUgly = data.creatures
		.creature_list
		.map(entry => entry.name)
		// https://github.com/TibiaData/tibiadata-api-go/issues/409
		.filter(name => !/^\s+$/.test(name));
	const boostableCreatures = boostableCreaturesUgly
		.map(name => pluralizedToPretty(name));

	// Add special cases.
	for (const entry of SPECIAL_CASES) {
		boostableCreaturesUgly.push(entry.uglyPluralName);
		boostableCreatures.push(entry.prettySingularName);
	}
	boostableCreaturesUgly.sort();
	boostableCreatures.sort(); // Normalization might affect the sort order.

	const todaysBoostedCreature = singularToPretty(data.creatures.boosted.name);
	const result = {
		boostableCreaturesUgly,
		boostableCreatures,
		todaysBoostedCreature,
	};
	return result;
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

const isoDate = (date) => {
	return date.toISOString().slice(0, 10);
};

const getDateIds = () => {
	const date = new Date();
	const today = isoDate(date);
	date.setDate(date.getDate() - 1);
	const yesterday = isoDate(date);
	return {
		yesterday,
		today,
	};
};

{
	const {yesterday, today} = getDateIds();
	const HISTORY_FILE_PATH = './data/boosted-creature-history.json';
	const json = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
	const boostedCreatureHistory = JSON.parse(json);
	if (boostedCreatureHistory[yesterday] === todaysBoostedCreature) {
		throw new Error('Upstream website hasn’t updated yet.');
	}
	if (!Object.hasOwn(boostedCreatureHistory, today)) {
		boostedCreatureHistory[today] = todaysBoostedCreature;
	}
	await fs.writeFile(
		HISTORY_FILE_PATH,
		stringify(boostedCreatureHistory)
	);
}
