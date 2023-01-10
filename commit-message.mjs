import * as fs from 'node:fs/promises';

const readJsonFile = async (fileName) => {
	const json = await fs.readFile(fileName, 'utf8');
	const data = JSON.parse(json);
	return data;
};

const getBoostedCount = async (creature) => {
	const creaturesPerCount = new Map(Object.entries(await readJsonFile('./data/boost-counts.json')));
	for (const [count, creatures] of creaturesPerCount) {
		if (creatures.includes(creature)) return Number(count);
	}
};

// https://v8.dev/features/intl-pluralrules#ordinal-numbers
const pr = new Intl.PluralRules('en-US', {
	type: 'ordinal'
});
const suffixes = new Map([
	['one',   'st'],
	['two',   'nd'],
	['few',   'rd'],
	['other', 'th'],
]);
const formatOrdinals = (n) => {
	const rule = pr.select(n);
	const suffix = suffixes.get(rule);
	return `${n}${suffix}`;
};

const HISTORY = new Map(Object.entries(await readJsonFile('./data/boosted-creature-history.json')));
const PREVIOUSLY_BOOSTED = [...HISTORY.values()];

const boostedToday = PREVIOUSLY_BOOSTED.at(-1);
const timesBoosted = await getBoostedCount(boostedToday);
const newlyPossibleTomorrow = PREVIOUSLY_BOOSTED.at(-31);
const date = new Date().toISOString().slice(0, 'yyyy-mm-dd'.length);
const message = `
Add data for date=${date}

The creature “${boostedToday}” is boosted for the ${formatOrdinals(timesBoosted)} time today.

The creature “${newlyPossibleTomorrow}” can be boosted again starting tomorrow, as it’s been 30 days since it was last boosted.
`.trim();
console.log(message);
