window.data = [];
window.ranges = [];
window.category = [];
window.categoryRanges = [];

function getCharacterCategoryCode(codepoint) {
	var categoryCode = window.category[codepoint];
	if (!categoryCode) {
		for (var i = 0; i < window.categoryRanges.length; ++i) {
			var range = window.categoryRanges[i];
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
	return window.generalCategoryNames[categoryCode] || 'Unknown';
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
	requestAsync('UCD/NameAliases.txt', function(lines) {
		window.aliases = [];
		window.controlAliases = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0 || lines[i][0] == '#')
				continue;
			var splitLine = lines[i].split(';');
			var codepoint = parseInt('0x' + splitLine[0]);
			var alias = splitLine[1];
			window.aliases.push({codepoint: codepoint, alias: alias});
			if (splitLine[2] == 'control')
				window.controlAliases.push({codepoint: codepoint, alias: alias});
		}
		completion();
	});
}

function initGeneralCategoryNames(completion) {
	requestAsync('UCD/PropertyValueAliases.txt', function(lines) {
		window.generalCategoryNames = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0)
				continue;
			var splitLine = lines[i].split('#');
			splitLine = splitLine[0];
			splitLine = splitLine.split(';');
			if (splitLine[0].trim() != 'gc')
				continue;
			var gc = splitLine[1].trim();
			var gcAlias = splitLine[2].trim();
			window.generalCategoryNames[gc] = gcAlias.replace('_', ' ');
		}
		completion();
	});
}

function initUnicodeData(completion) {
	requestAsync('UCD/UnicodeData.txt', function(lines) {
		window.data = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0)
				continue;
			var data_line = lines[i].split(';');
			if (data_line[1].endsWith(', First>')) {
				var startCodePoint = parseInt('0x' + data_line[0]);
				var endCodePoint = parseInt('0x' + lines[i+1].split(';')[0]);
				window.ranges.push([
					startCodePoint,
					endCodePoint,
					data_line[1].substring(1, data_line[1].length - 8)
				]);
				window.categoryRanges.push([
					startCodePoint,
					endCodePoint,
					data_line[2]
				]);
			} else if (data_line[1].endsWith(', Last>')) {
				continue;
			} else {
				window.data[parseInt('0x' + data_line[0])] = data_line[1];
				window.category[parseInt('0x' + data_line[0])] = data_line[2];
			}
		}
		completion();
	});
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

function getName(codepoint) {
	if (getUnicodeDataTxtNameField(codepoint).startsWith('Hangul Syllable')) {
		var decomposedSyllables = decompomposeHangulSyllable(codepoint);
		var shortJamoNames = [];
		for (var i = 0; i < decomposedSyllables.length; ++i)
			shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
		return 'HANGUL SYLLABLE ' + shortJamoNames.join('');
	}
	if (getUnicodeDataTxtNameField(codepoint).startsWith('CJK Ideograph')) {
		return "CJK UNIFIED IDEOGRAPH-" + itos(codepoint, 16, 4);
	}
	if (window.data[codepoint] && window.data[codepoint][0] != '<') {
		return window.data[codepoint];
	}
	return '';
}

function getHtmlNameDescription(codepoint) {
	if (getName(codepoint) != '')
		return getName(codepoint);
	if (window.data[codepoint] == '<control>') {
		var name = [];
		for (var j = 0; j < window.controlAliases.length; ++j) {
			if (window.controlAliases[j].codepoint == codepoint) {
				name.push(window.controlAliases[j].alias);
			}
		}
		if (name.length > 0)
			return '<i>' + name.join(' / ') + '</i>';
	}
	return '<i>Unknown-' + itos(codepoint, 16, 4) + '</i>'
}

function getUnicodeDataTxtNameField(codepoint) {
	if (window.data[codepoint])
		return window.data[codepoint];
	for (var i = 0; i < window.ranges.length; ++i) {
		var range = window.ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return range[2];
	}
	return 'Unknown';
}

function getUnicodeData(codepoint) {
	if (window.data[codepoint]) {
		var hexCodePoint = '0x' + codepoint.toString(16);
		if (window.data[codepoint] == '<control>') {
			var name = [];
			for (var j = 0; j < window.controlAliases.length; ++j) {
				if (window.controlAliases[j].codepoint == codepoint) {
					name.push(window.controlAliases[j].alias);
				}
			}
			var nameString = name.length > 0 ? '<control> (' + name.join(' / ') + ')' : '<control>';
			return getCodepointDescription(
				hexCodePoint,
				nameString
			);
		}
		return getCodepointDescription(hexCodePoint, window.data[codepoint]) + getHanEntry(codepoint);
	}
	for (var i = 0; i < window.ranges.length; ++i) {
		var range = window.ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return getCodepointDescription(codepoint, range[2]) + getHanEntry(codepoint);
	}
	return getCodepointDescription(codepoint, 'Unknown') + getHanEntry(codepoint);
}

function getSearchString(codepoint) {
	return getUnicodeData(codepoint).toUpperCase() + getName(codepoint).toUpperCase();
}

function searchCodepoints(str) {
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
	var reachedMaxResults = function() {
		if (results.length < 256)
			return false;
		results = deduplicate(results);
		if (results.length < 256)
			return false;
		return true;
	}

	str = str.toUpperCase();
	if (/^U\+[0-9A-F]+$/.test(str))
		results.push(parseInt(str.replace('U+', '0x')));
	if (/^0X[0-9A-F]+$/.test(str))
		results.push(parseInt(str.toLowerCase()));
	if (/^[0-9A-F]+$/.test(str))
		results.push(parseInt('0x' + str));
	if (/^[0-9]+$/.test(str))
		results.push(parseInt(str));

	for (var i = 0; i < window.blockRanges.length; ++i) {
		var block = window.blockRanges[i];
		for (var c = block.startCodepoint; c <= block.endCodepoint; ++c) {
			var searchString = getSearchString(c);
			if (searchString.includes(str)) {
				results.push(parseInt(c));
				if (reachedMaxResults())
					break;
			}
		}
	}
	for (var i = 0; i < window.aliases.length; ++i) {
		var searchString = window.aliases[i].alias;
		if (searchString.includes(str)) {
			results.push(window.aliases[i].codepoint);
		}
	}
	results = deduplicate(results);
	return results;
}