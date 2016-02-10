data = [];
ranges = [];
all_assigned_ranges = [{startCodepoint: 0, endCodepoint: 0}];
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
		generalCategoryNames[gc] = gcAlias.replace(/_/g, ' ');
	}, completion);
}

function initUnicodeData(completion) {
	var startCodepoint = 0;
	requestAsync('UCD/UnicodeData.txt', function() {
	}, function(line) {
		var data_line = line.split(';');
		if (data_line[1].endsWith(', First>')) {
			startCodepoint = parseInt('0x' + data_line[0]);
		} else if (data_line[1].endsWith(', Last>')) {
			var endCodepoint = parseInt('0x' + data_line[0]);
			ranges.push([
				startCodepoint,
				endCodepoint,
				data_line[1].substring(1, data_line[1].length - 7)
			]);
			if (data_line[1].startsWith('<CJK Ideograph') || data_line[1].startsWith('<Hangul Syllable')) {
				all_assigned_ranges.push({
					startCodepoint: startCodepoint,
					endCodepoint: endCodepoint
				});
			}
			categoryRanges.push([
				startCodepoint,
				endCodepoint,
				data_line[2]
			]);
		} else {
			var codepoint = parseInt('0x' + data_line[0]);
			data[codepoint] = data_line[1];
			category[codepoint] = data_line[2];
			if (all_assigned_ranges[all_assigned_ranges.length - 1].endCodepoint >= codepoint - 1) {
				++all_assigned_ranges[all_assigned_ranges.length - 1].endCodepoint;
			} else {
				all_assigned_ranges.push({startCodepoint: codepoint, endCodepoint: codepoint});
			}
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
