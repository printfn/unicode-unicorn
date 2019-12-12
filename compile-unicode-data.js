// This script parses data from various files in the 'data' directory,
//  and builds a single JS file in docs/build/compiled-data.js, and
//  a TS file in docs/build/compiled-data-declarations.ts.

const fs = require('fs');
const { exec } = require('child_process');

Array.prototype.sortByProperty = function(prop) {
	this.sort(function(a, b) {
		return a[prop] > b[prop] ? 1 : a[prop] == b[prop] ? 0 : -1;
	});
}

let finalOutputObject = {};
let lengths = [];
function out(varname, typestr, variable) {
	finalOutputObject[varname] = variable;
	lengths.push({
		name: varname,
		length: JSON.stringify(variable).length
	})
}

function iterateOverFile(path, before, each) {
	const lines = fs.readFileSync(path, `utf8`).split('\n');
	if (before)
		before(lines);
	if (each) {
		for (let i = 0; i < lines.length; ++i) {
			let line = lines[i];
			if (line.length === 0 || line[0] == `#`) {
				continue;
			}
			if (line.indexOf(`#`) != -1) {
				line = line.substring(0, line.indexOf(`#`));
			}
			each(line);
		}
	}
}

function iterateOverFileWithRanges(path, globalArray) {
	iterateOverFile(path, undefined, function(line) {
		const splitLine = line.split(`;`);
		let startCodepoint = 0, endCodepoint = 0;
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
			v: value
		});
	});
}

// Unicode data, han & search
(function() {

	let global_data = {};
	let global_ranges = [];

	// this element is modified as data is loaded, so don't change it
	let global_all_assigned_ranges = [{startCodepoint: 0, endCodepoint: 0}];
	let global_category = {};
	let global_categoryRanges = [];
	let global_generalCategoryNames = {};
	let global_aliases = [];

	let global_han_meanings = {};
	let global_mandarin_readings = {};
	let global_kun_readings = {};
	let global_on_readings = {};

	//let global_search_strings = {};

	let startCodepoint = 0;

	iterateOverFile(`data/Unicode/Unihan/Unihan_Readings.txt`, undefined, function(line) {
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

	iterateOverFile(`data/Unicode/UCD/UnicodeData.txt`, undefined, function(line) {
		const data_line = line.split(`;`);
		if (data_line[1].endsWith(`, First>`)) {
			startCodepoint = parseInt(data_line[0], 16);
		} else if (data_line[1].endsWith(`, Last>`)) {
			const endCodepoint = parseInt(data_line[0], 16);
			global_ranges.push({
				startCodepoint: startCodepoint,
				endCodepoint: endCodepoint,
				rangeName: data_line[1].substring(1, data_line[1].length - 7)
			});
			if (data_line[1].startsWith(`<CJK Ideograph`) || data_line[1].startsWith(`<Hangul Syllable`)) {
				global_all_assigned_ranges.push({
					startCodepoint: startCodepoint,
					endCodepoint: endCodepoint
				});
			}
			global_categoryRanges.push({
				startCodepoint: startCodepoint,
				endCodepoint: endCodepoint,
				categoryCode: data_line[2]
			});
		} else {
			const codepoint = parseInt(data_line[0], 16);
			global_data[codepoint] = data_line[1];
			global_category[codepoint] = data_line[2];
			if (global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint >= codepoint - 1) {
				++global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint;
			} else {
				global_all_assigned_ranges.push({startCodepoint: codepoint, endCodepoint: codepoint});
			}
		}
	});

	iterateOverFile(`data/Unicode/UCD/PropertyValueAliases.txt`, undefined, function(line) {
		let splitLine = line.split(`#`);
		splitLine = splitLine[0];
		splitLine = splitLine.split(`;`);
		if (splitLine[0].trim() != `gc`)
			return;
		const gc = splitLine[1].trim();
		const gcAlias = splitLine[2].trim();
		global_generalCategoryNames[gc] = gcAlias.replace(/_/g, ` `);
	});

	iterateOverFile(`data/Unicode/UCD/NameAliases.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		const codepoint = parseInt(splitLine[0], 16);
		global_aliases.push({codepoint: codepoint, alias: splitLine[1], type: splitLine[2]});
	});

	global_aliases.sort(function(a, b) {
		if (a.type == `control` && b.type != `control`)
			return -2;
		if (a.type != `control` && b.type == `control`)
			return 2;
		if (a.alias < b.alias)
			return -1;
		return a.alias > b.alias ? 1 : 0;
	});

	/*const getSearchString = function(codepoint) {
		let res = `${ctos([codepoint])
		}|U+${itos(codepoint, 16, 4)
		}|cp:${codepoint
		}|name:${getName(codepoint, true)
		}|script:${getScriptForCodepoint(codepoint).replace(/_/g, ` `)
		}|category:${getCharacterCategoryName(codepoint)}`;
		for (let i = 0; i < global_aliases.length; ++i) {
			if (global_aliases[i].codepoint == codepoint) {
				res += `|name:${global_aliases[i].alias}`;
			}
		}
		if (global_han_meanings[codepoint])
			res += global_han_meanings[codepoint];
		if (global_kun_readings[codepoint])
			res += `|kun:${global_kun_readings[codepoint].split(`, `).join(`|kun:`)}`;
		if (global_on_readings[codepoint])
			res += `|on:${global_on_readings[codepoint].split(`, `).join(`|on:`)}`;
		if (global_mandarin_readings[codepoint])
			res += `|mandarin:${global_mandarin_readings[codepoint].split(`, `).join(`|mandarin:`)}`;
		return res.toUpperCase();
	}

	for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
		const range = global_all_assigned_ranges[i];
		const end = range.endCodepoint;
		for (let c = range.startCodepoint; c <= end; ++c) {
			global_search_strings[c] = getSearchString(c);
		}
	}*/

	out(`global_data`, `{ [codepoint: number]: string; }`, global_data);
	out(`global_ranges`, `{ startCodepoint: number; endCodepoint: number; rangeName: string }[]`, global_ranges);
	out(`global_all_assigned_ranges`, `{ startCodepoint: number; endCodepoint: number; rangeName: string }[]`, global_all_assigned_ranges);
	out(`global_category`, `{ [codepoint: number]: string; }`, global_category);
	out(`global_categoryRanges`, `{ startCodepoint: number; endCodepoint: number; categoryCode: string }[]`, global_categoryRanges);

	out(`global_generalCategoryNames`, `{ [categoryCode: string]: string; }`, global_generalCategoryNames);
	out(`global_aliases`, `{ codepoint: number; alias: string; type: string; }[]`, global_aliases);

	out(`global_han_meanings`, `{ [codepoint: number]: string; }`, global_han_meanings);
	out(`global_mandarin_readings`, `{ [codepoint: number]: string; }`, global_mandarin_readings);
	out(`global_kun_readings`, `{ [codepoint: number]: string; }`, global_kun_readings);
	out(`global_on_readings`, `{ [codepoint: number]: string; }`, global_on_readings);

	//out(`global_search_strings`, `{ [codepoint: number]: string; }`, global_search_strings);
})();

// Variation sequences
(function() {
	let global_variationSequences = [];
	let global_ideographicVariationSequences = [];
	let global_ideographicVariationCollections = [];

	iterateOverFile(`data/Unicode/UCD/StandardizedVariants.txt`, undefined, function(line) {
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
			shapingEnvironments: shapingEnvironments
		});
	});

	iterateOverFile(`data/Unicode/IVD/IVD_Collections.txt`, undefined, function(line) {
		const fields = line.split(`;`);
		global_ideographicVariationCollections.push({
			name: fields[0],
			url: fields[2] // fields[1] is a regex describing item identifiers
		});
	});

	iterateOverFile(`data/Unicode/IVD/IVD_Sequences.txt`, undefined, function(line) {
		const fields = line.split(`;`);
		const codepoints = fields[0].split(` `).map((str) => parseInt(str, 16));
		const collection = fields[1].trim();
		const item = fields[2].trim();
		global_ideographicVariationSequences.push({
			b: codepoints[0], // base codepoint
			v: codepoints[1], // variation selector
			c: collection, // collection
			i: item // item, i.e. index into collection
		});
	});

	out(`global_variationSequences`, `VariationSequence[]`, global_variationSequences);
	out(`global_ideographicVariationSequences`, `IdeographicVariationSequence[]`, global_ideographicVariationSequences);
	out(`global_ideographicVariationCollections`, `VariationCollection[]`, global_ideographicVariationCollections);
})();

// Encodings
(function() {
	let global_encodingNames = [];
	let global_encodingData = [];

	iterateOverFile(`data/encodings.txt`, undefined, function(line) {
		const parts = line.split(`\t`);
		const type = parts[0];
		const name = parts[1];
		const url = parts[2];
		global_encodingNames.push(name);
		global_encodingData.push({
			name: name,
			type: type,
			data: fs.readFileSync(url, 'utf8')
		});
	});

	out(`global_encodingNames`, `string[]`, global_encodingNames);
	out(`global_encodingData`, `{ name: string, type: string, data: string }[]`, global_encodingData);
})();

// Graphemes & Emoji
(function() {
	let global_graphemeBreakData = {};
	let global_extendedPictograph = [];

	iterateOverFile(`data/Unicode/UCD/auxiliary/GraphemeBreakProperty.txt`, function() {}, function(line) {
		let state = 1;
		let startCodepoint = ``;
		let endCodepoint = ``;
		let value = ``;
		for (let j = 0; j < line.length; ++j) {
			const c = line[j];
			if (c == `#`)
				break;
			if (state == 1) {
				if (c != `.` && c != ` `) {
					startCodepoint += c;
					continue;
				} else {
					state = 2;
				}
			}
			if (state == 2) {
				if (c == ` `) {
					state = 3;
				} else if (c == `.`) {
					continue;
				} else {
					endCodepoint += c;
					continue;
				}
			}
			if (state == 3) {
				if (c == ` `)
					continue;
				else if (c == `;`) {
					state = 4;
					continue;
				}
			}
			if (state == 4) {
				if (c == ` `) {
					continue;
				} else if ((c >= `a` && c <= `z`) || (c >= `A` && c <= `Z`) || c == `_`) {
					value += c;
					continue;
				} else
					break;
			}
		}
		startCodepoint = parseInt(startCodepoint, 16);
		endCodepoint = endCodepoint === `` ? startCodepoint : parseInt(endCodepoint, 16);
		for (let x = startCodepoint; x <= endCodepoint; ++x) {
			global_graphemeBreakData[x] = value;
		}
	});

	iterateOverFile(`data/Unicode/emoji-data.txt`, undefined, function(line) {
		const components = line.split(`;`);
		if (components.length != 2) return;
		if (components[1].trim() != `Extended_Pictographic`) return;
		if (components[0].includes(`..`)) {
			const arr = components[0].trim().split(`..`);
			const start = parseInt(arr[0], 16);
			const end = parseInt(arr[1], 16);
			for (let i = start; i <= end; ++i) {
				global_extendedPictograph.push(i);
			}
		} else {
			global_extendedPictograph.push(parseInt(components[0].trim(), 16));
		}
	});

	out(`global_graphemeBreakData`, `{ [codepoint: number]: string; }`, global_graphemeBreakData);
	out(`global_extendedPictograph`, `number[]`, global_extendedPictograph);
})();

// Blocks
(function() {
	let global_blockRanges = [];
	let global_syllableRanges = [];
	let global_shortJamoNames = {};
	let global_scriptRanges = [];

	iterateOverFile(`data/Unicode/UCD/Blocks.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		const startCodepoint = parseInt(splitLine[0].split(`..`)[0], 16);
		const endCodepoint = parseInt(splitLine[0].split(`..`)[1], 16);
		const blockName = splitLine[1].trim();
		global_blockRanges.push({
			startCodepoint: startCodepoint,
			endCodepoint: endCodepoint,
			blockName: blockName
		});
	});

	iterateOverFileWithRanges(`data/Unicode/UCD/HangulSyllableType.txt`, global_syllableRanges);

	iterateOverFile(`data/Unicode/UCD/Jamo.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		const codepoint = parseInt(splitLine[0].trim(), 16);
		const shortJamoName = splitLine[1].trim();
		global_shortJamoNames[codepoint] = shortJamoName;
	});

	iterateOverFileWithRanges(`data/Unicode/UCD/Scripts.txt`, global_scriptRanges);

	out(`global_blockRanges`, `{ startCodepoint: number; endCodepoint: number; blockName: string; }[]`, global_blockRanges);
	out(`global_syllableRanges`, `{ s: number; e: number; v: string; }[]`, global_syllableRanges);
	out(`global_shortJamoNames`, `{ [codepoint: number]: string; }`, global_shortJamoNames);
	out(`global_scriptRanges`, `{ s: number; e: number; v: string; }[]`, global_scriptRanges);

})();

// Language subtag registry
(function() {
	const subtagRegistryFileContents = fs.readFileSync('data/language-subtag-registry', 'utf8');
	const allLanguageTags = [];
	const commonLanguageTags = [];
	const entries = subtagRegistryFileContents.split(`\n%%\n`);
	for (let i = 0; i < entries.length; ++i) {
		const fieldsStrings = entries[i].split(`\n`);
		const fields = {};
		for (let j = 0; j < fieldsStrings.length; ++j) {
			const kv = fieldsStrings[j].split(`: `);
			if (!fields[kv[0]])
				fields[kv[0]] = kv[1];
			else
				fields[kv[0]] += ` / ` + kv[1];
		}

		if (!fields[`Type`]) continue;
		if (fields[`Type`] == `grandfathered`) continue;
		if (fields[`Type`] == `redundant`) continue;
		// there is a lang value for every valid lang+extlang combination
		if (fields[`Type`] == `extlang`) continue;

		if (!fields[`Subtag`] || !fields[`Description`])
			throw `Invalid Format`;

		const languageTag = {
			code: fields[`Subtag`],
			name: fields[`Description`],
			type: fields[`Type`]
		};

		allLanguageTags.push(languageTag);

		if (fields[`Type`] != `language` || fields[`Subtag`].length <= 2){
			commonLanguageTags.push(languageTag);
		}
	}
	commonLanguageTags.sortByProperty('name');
	allLanguageTags.sortByProperty('name');
	let tagsToHTMLStrings = function(languageTags) {
		const htmls = {};
		for (let i = 0; i < languageTags.length; ++i) {
			if (!htmls[languageTags[i].type])
				htmls[languageTags[i].type] = `<option data-code="">None / Default</option>`;
			htmls[languageTags[i].type] += `<option data-code="${languageTags[i].code}">${languageTags[i].name} (${languageTags[i].code})</option>`;
		}
		return htmls;
	}
	out(`global_allLanguageTagsHTML`, `{ [key: string]: string; }`, tagsToHTMLStrings(allLanguageTags));
	out(`global_commonLanguageTagsHTML`, `{ [key: string]: string; }`, tagsToHTMLStrings(commonLanguageTags));
})();

lengths.sortByProperty('length');

const finalOutputString = JSON.stringify(finalOutputObject);
console.log(`Total length: ${finalOutputString.length}`);
for (let i = 0; i < lengths.length; ++i) {
	const x = lengths[i];
	console.log(`${x.name}: ${x.length} (${lengths[i].length / finalOutputString.length * 100}%)`);
}

fs.writeFileSync('docs/build/compiled-data.json', finalOutputString);
