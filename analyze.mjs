import * as fs from 'node:fs/promises';

const readJsonFile = async (fileName) => {
	const json = await fs.readFile(fileName, 'utf8');
	const data = JSON.parse(json);
	return data;
};

const writeJsonFile = async (fileName, data) => {
	const json = JSON.stringify(data, null, '\t') + '\n';
	await fs.writeFile(fileName, json);
};

const BOOSTABLE_CREATURES = new Set(await readJsonFile('./data/boostable-creatures.json'));
const HISTORY = new Map(Object.entries(await readJsonFile('./data/boosted-creature-history.json')));
const PREVIOUSLY_BOOSTED = [...HISTORY.values()];

// Which creature could be boosted tomorrow?
// “The boosted boss system has the same cooldown as the boosted
// creature system. A boosted boss can’t become boosted again for
// 30 days.” — CipSoft
{
	const lastThirtyCreatures = new Set(PREVIOUSLY_BOOSTED.slice(-30).sort());
	const boostableTomorrow = new Set();
	for (const creature of BOOSTABLE_CREATURES) {
		if (!lastThirtyCreatures.has(creature)) {
			boostableTomorrow.add(creature);
		}
	}
	await writeJsonFile('./data/non-boostable-creatures-tomorrow.json', [...lastThirtyCreatures]);
	await writeJsonFile('./data/boostable-creatures-tomorrow.json', [...boostableTomorrow]);
}

// Which creatures have never been boosted?
{
	const PREVIOUSLY_BOOSTED_SET = new Set(PREVIOUSLY_BOOSTED);
	const NOT_PREVIOUSLY_BOOSTED = new Set(
		Array.from(BOOSTABLE_CREATURES).filter(x => !PREVIOUSLY_BOOSTED_SET.has(x))
	);
	await writeJsonFile('./data/not-previously-boosted.json', [...NOT_PREVIOUSLY_BOOSTED]);
}

// Which creatures have been boosted most often?
{
	// creature → count
	const boostedCounts = new Map();
	for (const creature of BOOSTABLE_CREATURES) {
		boostedCounts.set(creature, 0);
	}
	for (const creature of HISTORY.values()) {
		// Note: The fallback is necessary because crypt warrior does not
		// appear in the list of boostable creatures, despite having been
		// boosted twice.
		const prev = boostedCounts.get(creature) || 0;
		boostedCounts.set(creature, prev + 1);
	}
	// count → [creature1, creature2, …]
	const creaturesPerBoostedCount = new Map();
	for (const [creature, count] of boostedCounts) {
		if (creaturesPerBoostedCount.has(count)) {
			creaturesPerBoostedCount.get(count).push(creature);
		} else {
			creaturesPerBoostedCount.set(count, [creature]);
		}
	}
	for (const [count, creatures] of creaturesPerBoostedCount) {
		creaturesPerBoostedCount.set(count, creatures.sort());
	}

	await writeJsonFile('./data/boost-counts.json', Object.fromEntries(creaturesPerBoostedCount));
}
