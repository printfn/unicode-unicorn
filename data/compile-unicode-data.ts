// This script parses data from various files in the 'data' directory,
//  and builds a single JSON file dist/compiled-data.json.

import * as fs from 'fs';

import { CompiledData, VariationCollection, VariationSequence } from './data-types';

function sortByProperty(array: any[], prop: string) {
	array.sort(function (a: any, b: any) {
		return a[prop] > b[prop] ? 1 : a[prop] == b[prop] ? 0 : -1;
	});
}

let finalOutputObject: Partial<CompiledData> = {};

function stripCommentsFromLine(line: string) {
	if (line.length === 0 || line[0] == '#') {
		return;
	}
	if (line.indexOf(`#`) != -1) {
		return line.substring(0, line.indexOf('#'));
	}
	return line;
}

function iterateOverFile(path: string, each: (s: string) => void) {
	const lines = fs.readFileSync(path, 'utf8').split('\n');
	for (const line of lines) {
		const lineWithoutComments = stripCommentsFromLine(line);
		if (lineWithoutComments) {
			each(lineWithoutComments);
		}
	}
}

function iterateOverFileWithRanges(path: string, globalArray: any[]) {
	iterateOverFile(path, function (line) {
		const splitLine = line.split(`;`);
		let startCodepoint = 0,
			endCodepoint = 0;
		if (splitLine[0].trim().split(`..`).length == 2) {
			startCodepoint = parseInt(splitLine[0].trim().split(`..`)[0], 16);
			endCodepoint = parseInt(splitLine[0].trim().split(`..`)[1], 16);
		} else {
			startCodepoint = parseInt(splitLine[0].trim(), 16);
			endCodepoint = startCodepoint;
		}
		const value = splitLine[1].trim();
		globalArray.push({
			s: startCodepoint,
			e: endCodepoint,
			v: value,
		});
	});
}

// Unicode data, han & search
(function () {
	// this element is modified as data is loaded, so don't change it
	let global_all_assigned_ranges: {
		startCodepoint: number;
		endCodepoint: number;
	}[] = [{ startCodepoint: 0, endCodepoint: 0 }];
	let global_aliases: {
		codepoint: number;
		alias: string;
		type: string;
	}[] = [];

	let global_han_meanings: { [codepoint: number]: string } = {};
	let global_mandarin_readings: { [codepoint: number]: string } = {};
	let global_kun_readings: { [codepoint: number]: string } = {};
	let global_on_readings: { [codepoint: number]: string } = {};

	let startCodepoint = 0;

	iterateOverFile(`data/Unicode/Unihan/Unihan_Readings.txt`, function (line) {
		const fields = line.split(`\t`);
		const codepoint = parseInt(fields[0].substring(2), 16);
		if (fields[1] == `kDefinition`) {
			global_han_meanings[codepoint] = fields[2];
		} else if (fields[1] == `kMandarin`) {
			global_mandarin_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
		} else if (fields[1] == `kJapaneseKun`) {
			global_kun_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
		} else if (fields[1] == `kJapaneseOn`) {
			global_on_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
		}
	});

	iterateOverFile(`data/Unicode/UCD/UnicodeData.txt`, function (line) {
		const data_line = line.split(`;`);
		if (data_line[1].endsWith(`, First>`)) {
			startCodepoint = parseInt(data_line[0], 16);
		} else if (data_line[1].endsWith(`, Last>`)) {
			const endCodepoint = parseInt(data_line[0], 16);
			if (
				data_line[1].startsWith(`<CJK Ideograph`) ||
				data_line[1].startsWith(`<Hangul Syllable`)
			) {
				global_all_assigned_ranges.push({
					startCodepoint: startCodepoint,
					endCodepoint: endCodepoint,
				});
			}
		} else {
			const codepoint = parseInt(data_line[0], 16);
			if (
				global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint >=
				codepoint - 1
			) {
				++global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint;
			} else {
				global_all_assigned_ranges.push({
					startCodepoint: codepoint,
					endCodepoint: codepoint,
				});
			}
		}
	});

	iterateOverFile(`data/Unicode/UCD/NameAliases.txt`, function (line) {
		const splitLine = line.split(`;`);
		const codepoint = parseInt(splitLine[0], 16);
		global_aliases.push({ codepoint: codepoint, alias: splitLine[1], type: splitLine[2] });
	});

	global_aliases.sort(function (a, b) {
		if (a.type == `control` && b.type != `control`) return -2;
		if (a.type != `control` && b.type == `control`) return 2;
		if (a.alias < b.alias) return -1;
		return a.alias > b.alias ? 1 : 0;
	});

	finalOutputObject.global_all_assigned_ranges = global_all_assigned_ranges;

	finalOutputObject.global_aliases = global_aliases;

	finalOutputObject.global_han_meanings = global_han_meanings;
	finalOutputObject.global_mandarin_readings = global_mandarin_readings;
	finalOutputObject.global_kun_readings = global_kun_readings;
	finalOutputObject.global_on_readings = global_on_readings;
})();

// Variation sequences
(function () {
	let global_variationSequences: VariationSequence[] = [];
	let global_ideographicVariationCollections: VariationCollection[] = [];

	iterateOverFile(`data/Unicode/UCD/StandardizedVariants.txt`, function (line) {
		const fields = line.split(`;`);
		const codepoints = fields[0].split(` `).map((str) => parseInt(str, 16));
		const description = fields[1].trim();
		let shapingEnvironments = fields[2].trim().split(` `);
		if (shapingEnvironments.length == 1 && shapingEnvironments[0] === ``)
			shapingEnvironments = [];
		global_variationSequences.push({
			baseCodepoint: codepoints[0],
			variationSelector: codepoints[1],
			description: description,
			shapingEnvironments: shapingEnvironments,
		});
	});

	iterateOverFile(`data/Unicode/IVD/IVD_Collections.txt`, function (line) {
		const fields = line.split(`;`);
		global_ideographicVariationCollections.push({
			name: fields[0],
			url: fields[2], // fields[1] is a regex describing item identifiers
		});
	});

	finalOutputObject.global_variationSequences = global_variationSequences;
	finalOutputObject.global_ideographicVariationCollections =
		global_ideographicVariationCollections;
})();

// Encodings
(function () {
	let global_encodingNames: string[] = [];
	let global_encodingData: { name: string; type: string }[] = [];

	iterateOverFile(`data/encodings.txt`, function (line) {
		const parts = line.split(`\t`);
		const type = parts[0];
		const name = parts[1];
		global_encodingNames.push(name);
		global_encodingData.push({
			name: name,
			type: type,
		});
	});

	finalOutputObject.global_encodingNames = global_encodingNames;
	finalOutputObject.global_encodingData = global_encodingData;
})();

// Blocks
(function () {
	let global_blockRanges: {
		startCodepoint: number;
		endCodepoint: number;
		blockName: string;
	}[] = [];

	iterateOverFile(`data/Unicode/UCD/Blocks.txt`, function (line) {
		const splitLine = line.split(`;`);
		const startCodepoint = parseInt(splitLine[0].split(`..`)[0], 16);
		const endCodepoint = parseInt(splitLine[0].split(`..`)[1], 16);
		const blockName = splitLine[1].trim();
		global_blockRanges.push({
			startCodepoint: startCodepoint,
			endCodepoint: endCodepoint,
			blockName: blockName,
		});
	});

	finalOutputObject.global_blockRanges = global_blockRanges;
})();

// Language subtag registry
(function () {
	const subtagRegistryFileContents = fs.readFileSync('data/language-subtag-registry', 'utf8');
	const allLanguageTags: { [type: string]: { code: string; name: string }[] } = {};
	const commonLanguageTags: { [type: string]: { code: string; name: string }[] } = {};
	const entries = subtagRegistryFileContents.split(`\n%%\n`);
	for (let i = 0; i < entries.length; ++i) {
		const fieldsStrings = entries[i].split(`\n`);
		const fields: { [name: string]: string } = {};
		for (let j = 0; j < fieldsStrings.length; ++j) {
			const kv = fieldsStrings[j].split(`: `);
			if (!fields[kv[0]]) fields[kv[0]] = kv[1];
			else fields[kv[0]] += ` / ` + kv[1];
		}

		if (!fields[`Type`]) continue;
		if (fields[`Type`] == `grandfathered`) continue;
		if (fields[`Type`] == `redundant`) continue;
		// there is a lang value for every valid lang+extlang combination
		if (fields[`Type`] == `extlang`) continue;
		if (fields[`Deprecated`]) continue;

		if (!fields[`Subtag`] || !fields[`Description`]) throw new Error('Invalid Format');

		const languageTag = {
			code: fields[`Subtag`],
			name: fields[`Description`],
		};

		if (allLanguageTags[fields[`Type`]] === undefined) {
			allLanguageTags[fields[`Type`]] = [];
		}

		allLanguageTags[fields[`Type`]].push(languageTag);

		if (fields[`Type`] != `language` || fields[`Subtag`].length <= 2) {
			if (commonLanguageTags[fields[`Type`]] === undefined) {
				commonLanguageTags[fields[`Type`]] = [];
			}

			commonLanguageTags[fields[`Type`]].push(languageTag);
		}
	}
	for (const type of Object.values(commonLanguageTags)) {
		sortByProperty(type, 'name');
	}
	for (const type of Object.values(allLanguageTags)) {
		sortByProperty(type, 'name');
	}
	finalOutputObject.global_allLanguageTags = allLanguageTags;
	finalOutputObject.global_commonLanguageTags = commonLanguageTags;
})();

let lengths: { name: string; length: number }[] = [];

for (const key of Object.keys(finalOutputObject)) {
	const value = (finalOutputObject as { [name: string]: object })[key];
	lengths.push({
		name: key,
		length: JSON.stringify(value).length,
	});
}

sortByProperty(lengths, 'length');

const finalOutputString = JSON.stringify(finalOutputObject);
console.log(`Total length: ${finalOutputString.length}`);
for (let i = 0; i < lengths.length; ++i) {
	const x = lengths[i];
	console.log(
		`${x.name}: ${x.length} (${((lengths[i].length / finalOutputString.length) * 100).toFixed(
			2,
		)}%)`,
	);
}

fs.writeFileSync('data/compiled-data.json', finalOutputString);
