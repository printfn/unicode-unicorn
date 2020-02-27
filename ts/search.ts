let global_search_strings: { [codepoint: number]: string; } = [];

function getTermsForSearchString(array: { [codepoint: number]: string; }, codepoint: number, prefix: string) {
	let entry = array[codepoint];
	if (!entry) {
		return '';
	}

	return `${prefix}${entry.split(', ').join(prefix)}`;
}

function getAliasSearchStringForCodepoint(codepoint: number) {
	let res = '';

	for (let i = 0; i < global_aliases.length; ++i) {
		if (global_aliases[i].codepoint == codepoint) {
			res += `|name:${global_aliases[i].alias}`;
		}
	}

	return res;
}

function getSearchString(codepoint: number) {
	let res = `${ctos([codepoint])
	}|U+${itos(codepoint, 16, 4)
	}|cp:${codepoint
	}|name:${getName(codepoint, true)
	}|block:${getBlockForCodepoint(codepoint)
	}|script:${getScriptForCodepoint(codepoint).replace(/_/g, ` `)
	}|category:${getCharacterCategoryName(codepoint)}`;

	res += getAliasSearchStringForCodepoint(codepoint);

	if (global_han_meanings[codepoint]) {
		res += global_han_meanings[codepoint];
	}

	res += getTermsForSearchString(global_kun_readings, codepoint, '|kun:');
	res += getTermsForSearchString(global_on_readings, codepoint, '|on:');
	res += getTermsForSearchString(global_mandarin_readings, codepoint, '|mandarin:');

	return res.toUpperCase();
}

function initializeSearchStrings() {
	for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
		const range = global_all_assigned_ranges[i];
		const end = range.endCodepoint;
		for (let c = range.startCodepoint; c <= end; ++c) {
			global_search_strings[c] = getSearchString(c);
		}
	}
}

function testSearch(searchString: string, words: string[]) {
	if (!searchString.includes(words[0]))
		return false;
	for (let i = 1; i < words.length; ++i) {
		if (!searchString.includes(words[i]))
			return false;
	}
	return true;
}

function wordsFromSearchExpression(str: string) {
	str = str.toUpperCase();
	const words = str.split(`,`);
	for (let i = 0; i < words.length; ++i) {
		words[i] = words[i].trim();
	}
	return words;
}

function searchCodepoints(str: string) {
	const results: number[] = [];

	const words = wordsFromSearchExpression(str);

	for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
		const range = global_all_assigned_ranges[i];
		const end = range.endCodepoint;
		for (let c = range.startCodepoint; c <= end; ++c) {
			const searchString = global_search_strings[c];
			if (!searchString) {
				continue;
			}

			if (testSearch(searchString, words)) {
				results.push(c);
				if (results.length >= 256) {
					return results;
				}
			}
		}
	}

	return results;
}
