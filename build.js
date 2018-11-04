#!/usr/local/bin/node
// This script parses data from various files in the 'data' directory,
//  and builds a single TS file in src/compiled-data.ts

var fs = require('fs');

let finalOutput = ``;
function out(varname, typestr, variable) {
	if (typeof(variable) == 'undefined') {
		variable = typestr;
		finalOutput += `const ${varname} = ${JSON.stringify(variable)};\n`;
	} else {
		finalOutput += `const ${varname}: ${typestr} = ${JSON.stringify(variable)};\n`;
	}
}

function iterateOverFile(path, before, each, after) {
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
	if (after) {
		after();
	}
}

// Han
(function() {
	let global_han_meanings = {};
	let global_mandarin_readings = {};
	let global_kun_readings = {};
	let global_on_readings = {};
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
	out(`global_han_meanings`, `{ [codepoint: number]: string; }`, global_han_meanings);
	out(`global_mandarin_readings`, `{ [codepoint: number]: string; }`, global_mandarin_readings);
	out(`global_kun_readings`, `{ [codepoint: number]: string; }`, global_kun_readings);
	out(`global_on_readings`, `{ [codepoint: number]: string; }`, global_on_readings);
})();

// Unicode data
(function() {

	let global_data = {};
	let global_ranges = [];

	// this element is modified as data is loaded, so don't change it
	let global_all_assigned_ranges = [{startCodepoint: 0, endCodepoint: 0}];
	let global_category = {};
	let global_categoryRanges = [];

	let startCodepoint = 0;

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

	out(`global_data`, `{ [codepoint: number]: string; }`, global_data);
	out(`global_ranges`, `{ startCodepoint: number; endCodepoint: number; rangeName: string }[]`, global_ranges);
	out(`global_all_assigned_ranges`, global_all_assigned_ranges);
	out(`global_category`, `{ [codepoint: number]: string; }`, global_category);
	out(`global_categoryRanges`, `{ startCodepoint: number; endCodepoint: number; categoryCode: string }[]`, global_categoryRanges);
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

		allLanguageTags.push({
			code: fields[`Subtag`],
			name: fields[`Description`],
			type: fields[`Type`]
		});

		if (fields[`Type`] != `language` || fields[`Subtag`].length <= 2){
			commonLanguageTags.push({
				code: fields[`Subtag`],
				name: fields[`Description`],
				type: fields[`Type`]
			});
		}
	}
	commonLanguageTags.sort(function(a, b) {
		return a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
	});
	allLanguageTags.sort(function(a, b) {
		return a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
	});
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

fs.writeFileSync('src/compiled-data.ts', finalOutput);
