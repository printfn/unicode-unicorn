data = [];
ranges = [];
category = [];
categoryRanges = [];

function getCharacterCategoryCode(codepoint) {
	var categoryCode = category[codepoint];
	if (!categoryCode) {
		for (var i = 0; i < categoryRanges.length; ++i) {
			var range = categoryRanges[i];
			if (codepoint >= range[0] && codepoint <= range[1]) {
				categoryCode = range[2];
				break;
			}
		}
	}
	return categoryCode;
}

function getCharacterCategoryName(codepoint) {
	var categoryCode = getCharacterCategoryCode(codepoint);
	return generalCategoryNames[categoryCode] || 'Unknown';
}

// see the Unicode Standard, section 3.6 "Combination", "Combining Character Sequences", D50: "Graphic character"
function isGraphic(codepoint, arePrivateUseCharsGraphic) {
	var categoryCode = getCharacterCategoryCode(codepoint);
	if (!categoryCode)
		return;
	if (categoryCode.startsWith('L') || categoryCode.startsWith('M')
		|| categoryCode.startsWith('N') || categoryCode.startsWith('P')
		|| categoryCode.startsWith('S') || categoryCode == 'Zs')
		return true;
	if (categoryCode == 'Co')
		return arePrivateUseCharsGraphic;
	return false;
}

function getCodepointDescription(codepoint, name) {
	codepoint = parseInt(codepoint);
	return name + ' ' + ctos([codepoint]);
}

function initAliasData(completion) {
	requestAsync('UCD/NameAliases.txt', function() {
		aliases = [];
		controlAliases = [];
	}, function(line) {
		var splitLine = line.split(';');
		var codepoint = parseInt('0x' + splitLine[0]);
		var alias = splitLine[1];
		aliases.push({codepoint: codepoint, alias: alias});
		if (splitLine[2] == 'control')
			controlAliases.push({codepoint: codepoint, alias: alias});
	}, completion);
}

function initGeneralCategoryNames(completion) {
	requestAsync('UCD/PropertyValueAliases.txt', function() {
		generalCategoryNames = [];
	}, function(line) {
		var splitLine = line.split('#');
		splitLine = splitLine[0];
		splitLine = splitLine.split(';');
		if (splitLine[0].trim() != 'gc')
			return;
		var gc = splitLine[1].trim();
		var gcAlias = splitLine[2].trim();
		generalCategoryNames[gc] = gcAlias.replace('_', ' ');
	}, completion);
}

function initUnicodeData(completion) {
	requestAsync('UCD/UnicodeData.txt', function() {
		data = [];
		startCodePoint = 0;
	}, function(line) {
		var data_line = line.split(';');
		if (data_line[1].endsWith(', First>')) {
			startCodePoint = parseInt('0x' + data_line[0]);
		} else if (data_line[1].endsWith(', Last>')) {
			var endCodePoint = parseInt('0x' + data_line[0]);
			ranges.push([
				startCodePoint,
				endCodePoint,
				data_line[1].substring(1, data_line[1].length - 7)
			]);
			categoryRanges.push([
				startCodePoint,
				endCodePoint,
				data_line[2]
			]);
		} else {
			data[parseInt('0x' + data_line[0])] = data_line[1];
			category[parseInt('0x' + data_line[0])] = data_line[2];
		}
	}, completion);
}

function decompomposeHangulSyllable(codepoint) {
	var syllableType = getSyllableTypeForCodepoint(codepoint);
	if (syllableType == 'Not_Applicable')
		return [codepoint];

	// see Unicode Standard, section 3.12 "Conjoining Jamo Behavior", "Hangul Syllable Decomposition"
	var SBase = 0xAC00;
	var LBase = 0x1100;
	var VBase = 0x1161;
	var TBase = 0x11A7;
	var LCount = 19;
	var VCount = 21;
	var TCount = 28;
	var NCount = VCount * TCount; // 588
	var SCount = LCount * NCount; // 11172

	var SIndex = codepoint - SBase;

	var LIndex = Math.floor(SIndex / NCount);
	var VIndex = Math.floor((SIndex % NCount) / TCount);
	var TIndex = SIndex % TCount;

	var LPart = LBase + LIndex;
	var VPart = VBase + VIndex;
	if (TIndex > 0) {
		return [LPart, VPart, TBase + TIndex];
	} else {
		return [LPart, VPart];
	}
}

function getName(codepoint, search) {
	var d = data[codepoint];
	if (d) {
		if (d[0] != '<')
			return d;
		else
			return '';
	}
	if (0xAC00 <= codepoint && codepoint <= 0xD7AF) {
		var decomposedSyllables = decompomposeHangulSyllable(codepoint);
		var shortJamoNames = [];
		for (var i = 0; i < decomposedSyllables.length; ++i)
			shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
		return 'HANGUL SYLLABLE ' + shortJamoNames.join('');
	}
	if ((0x3400 <= codepoint && codepoint <= 0x4DBF)
		|| (0x4E00 <= codepoint && codepoint <= 0x9FFF)) {
		if (search)
			return 'CJK UNIFIED IDEOGRAPH';
		return 'CJK UNIFIED IDEOGRAPH-' + itos(codepoint, 16, 4);
	}
	for (var i = 0; i < ranges.length; ++i) {
		var range = ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1]) {
			if (range[2].startsWith('CJK Ideograph')) {
				if (search)
					return 'CJK UNIFIED IDEOGRAPH';
				return 'CJK UNIFIED IDEOGRAPH-' + itos(codepoint, 16, 4);
			}
		}
	}
	return '';
}

function getHtmlNameDescription(codepoint) {
	if (getName(codepoint) != '')
		return getName(codepoint);
	if (data[codepoint] == '<control>') {
		var name = [];
		for (var j = 0; j < controlAliases.length; ++j) {
			if (controlAliases[j].codepoint == codepoint) {
				name.push(controlAliases[j].alias);
			}
		}
		if (name.length > 0)
			return '<i>' + name.join(' / ') + '</i>';
	}
	return '<i>Unknown-' + itos(codepoint, 16, 4) + '</i>'
}

function getUnicodeDataTxtNameField(codepoint) {
	if (data[codepoint])
		return data[codepoint];
	for (var i = 0; i < ranges.length; ++i) {
		var range = ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return range[2];
	}
	return 'Unknown';
}

function getSearchString(codepoint) {
	return getName(codepoint, true) + getSearchHanEntry(codepoint);
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
	if (/^U\+[0-9A-F]+$/.test(str))
		results.push(parseInt(str.replace('U+', '0x')));
	if (/^0X[0-9A-F]+$/.test(str))
		results.push(parseInt(str.toLowerCase()));
	if (/^[0-9A-F]+$/.test(str))
		results.push(parseInt('0x' + str));
	if (/^[0-9]+$/.test(str))
		results.push(parseInt(str));

	var plainResults = [];
	var plainResultsLength = 0;
	for (var c in data) {
		var searchString = getSearchString(parseInt(c));
		if (testSearch(searchString, words)) {
			plainResults.push(parseInt(c));
			++plainResultsLength;
			if (reachedMaxResults(plainResults))
				break;
		}
	}
	var rangeResults = [];
	for (var i = 0; i < ranges.length; ++i) {
		var range = ranges[i];
		if (range[2].startsWith('Hangul Syllable')) {
			for (var c = range[0]; c <= range[1]; ++c) {
				if (c > plainResults.length && plainResultsLength >= 256)
					break;
				var searchString = getSearchString(c);
				if (testSearch(searchString, words)) {
					rangeResults.push(c);
					if (reachedMaxResults(rangeResults))
						break;
				}
			}
		}
		if (range[2].startsWith('CJK Ideograph')) {
			for (var c = range[0]; c <= range[1]; ++c) {
				if (c > plainResults.length && plainResultsLength >= 256)
					break;
				var searchString = getSearchHanEntry(c);
				if (testSearch(searchString, words)) {
					rangeResults.push(c);
					if (reachedMaxResults(rangeResults))
						break;
				}
			}
		}
	}
	var aliasResults = [];
	for (var i = 0; i < aliases.length; ++i) {
		var searchString = aliases[i].alias;
		if (testSearch(searchString, words)) {
			aliasResults.push(aliases[i].codepoint);
		}
	}
	results = results.concat(plainResults, rangeResults, aliasResults);
	results = deduplicate(results);
	completion(results);
}