// This script parses data from various files in the 'data' directory,
//  and builds a single TS file in src/compiled-data.ts

var fs = require('fs');

let compileLanguagesSubtagRegistry = function() {
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
	return `
	const global_allLanguageTagsHTML: { [key: string]: string; } = ${JSON.stringify(tagsToHTMLStrings(allLanguageTags))};
	const global_commonLanguageTagsHTML: { [key: string]: string; } = ${JSON.stringify(tagsToHTMLStrings(commonLanguageTags))};
	`;
}

const functions = [compileLanguagesSubtagRegistry];
let finalOutput = ``;
for (let i in functions) {
	finalOutput += functions[i]();
}
fs.writeFileSync('src/compiled-data.ts', finalOutput);
