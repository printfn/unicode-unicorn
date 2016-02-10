function getSearchString(codepoint) {
	var res = 'U+' + itos(codepoint, 16, 4)
	    + '|' + codepoint
	    + '|' + getName(codepoint, true)
	    + '|' + getBlockForCodepoint(codepoint).replace(/_/g, ' ')
	    + '|' + getScriptForCodepoint(codepoint).replace(/_/g, ' ')
	for (var i = 0; i < aliases.length; ++i) {
		if (aliases[i].codepoint == codepoint) {
			res += '|' + aliases[i].alias;
		}
	}
	if (han_meanings[codepoint])
		res += '|' + han_meanings[codepoint];
	if (kun_readings[codepoint])
		res += '|' + kun_readings[codepoint];
	if (on_readings[codepoint])
		res += '|' + on_readings[codepoint];
	if (mandarin_readings[codepoint])
		res += '|' + mandarin_readings[codepoint];
	return res.toUpperCase();
}

function initializeSearchStrings() {
	search_strings = [];

	for (var i = 0; i < all_assigned_ranges.length; ++i) {
		var range = all_assigned_ranges[i];
		var end = range.endCodepoint;
		for (var c = range.startCodepoint; c < end; ++c) {
			var searchString = getSearchString(c);
			search_strings[c] = searchString;
		}
	}
}

function testSearch(ss, words) {
	if (!ss.includes(words[0]))
		return false;
	for (var i = 1; i < words.length; ++i) {
		if (!ss.includes(words[i]))
			return false;
	}
	return true;
}

function searchCodepoints(str, completion) {
	var results = [];

	var deduplicate = function(a) {
		var temp = {};
		for (var i = 0; i < a.length; i++)
			temp[a[i]] = true;
		var r = [];
		for (var k in temp) {
			if (r.length < 256) {
				r.push(parseInt(k));
			}
		}
		return r;
	}
	var reachedMaxResults = function(results) {
		if (results.length < 256)
			return false;
		results = deduplicate(results);
		if (results.length < 256)
			return false;
		return true;
	}

	str = str.toUpperCase();
	var words = str.split(',');
	for (var i = 0; i < words.length; ++i)
		words[i] = words[i].trim();

	var results = [];
	for (var i = 0; i < all_assigned_ranges.length; ++i) {
		var range = all_assigned_ranges[i];
		var end = range.endCodepoint;
		for (var c = range.startCodepoint; c < end; ++c) {
			var searchString = search_strings[c];
			if (!searchString)
				continue;
			if (testSearch(searchString, words)) {
				results.push(parseInt(c));
				if (reachedMaxResults(results))
					break;
			}
		}
	}

	results = deduplicate(results);
	completion(results);
}
