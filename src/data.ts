var global_data: { [codepoint: number]: string; } = [];
var global_ranges: { startCodepoint: number; endCodepoint: number; rangeName: string }[] = [];
var global_all_assigned_ranges = [{startCodepoint: 0, endCodepoint: 0}]; // this element is modified as data is loaded, so don't change it
var global_category: { [codepoint: number]: string; } = [];
var global_categoryRanges: { startCodepoint: number; endCodepoint: number; categoryCode: string }[] = [];
var global_aliases: { codepoint: number; alias: string; type: string; }[] = [];
var global_generalCategoryNames: { [categoryCode: string]: string; } = {};

function getCharacterCategoryCode(codepoint: number): string {
	var categoryCode = global_category[codepoint];
	if (!categoryCode) {
		for (var i = 0; i < global_categoryRanges.length; ++i) {
			var range = global_categoryRanges[i];
			if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
				categoryCode = range.categoryCode;
				break;
			}
		}
	}
	return categoryCode;
}

function getCharacterCategoryName(codepoint: number): string {
	var categoryCode = getCharacterCategoryCode(codepoint);
	return global_generalCategoryNames[categoryCode] || 'Unknown';
}

function getCodepointDescription(codepoint: number | string, name: string): string {
	if (typeof codepoint == 'string') {
		codepoint = parseInt(codepoint);
	}
	return name + ' ' + ctos([codepoint]);
}

function initAliasData(completion: () => void) {
	requestAsync('data/Unicode/UCD/NameAliases.txt', null, function(line) {
		var splitLine = line.split(';');
		var codepoint = parseInt(splitLine[0], 16);
		global_aliases.push({codepoint: codepoint, alias: splitLine[1], type: splitLine[2]});
	}, completion);
	global_aliases.sort(function(a, b) {
		if (a.type == 'control' && b.type != 'control')
			return 1;
		if (a.type != 'control' && b.type == 'control')
			return -1;
		if (a.alias < b.alias)
			return 1;
		if (a.alias > b.alias)
			return -1;
		return 0;
	});
}

function initGeneralCategoryNames(completion: () => void) {
	requestAsync('data/Unicode/UCD/PropertyValueAliases.txt', null, function(line) {
		var splitLine: string[] | string = line.split('#');
		splitLine = splitLine[0];
		splitLine = splitLine.split(';');
		if (splitLine[0].trim() != 'gc')
			return;
		var gc = splitLine[1].trim();
		var gcAlias = splitLine[2].trim();
		global_generalCategoryNames[gc] = gcAlias.replace(/_/g, ' ');
	}, completion);
}

function initUnicodeData(completion: () => void) {
	var startCodepoint = 0;
	requestAsync('data/Unicode/UCD/UnicodeData.txt', null, function(line) {
		var data_line = line.split(';');
		if (data_line[1].endsWith(', First>')) {
			startCodepoint = parseInt(data_line[0], 16);
		} else if (data_line[1].endsWith(', Last>')) {
			var endCodepoint = parseInt(data_line[0], 16);
			global_ranges.push({
				startCodepoint: startCodepoint,
				endCodepoint: endCodepoint,
				rangeName: data_line[1].substring(1, data_line[1].length - 7)
			});
			if (data_line[1].startsWith('<CJK Ideograph') || data_line[1].startsWith('<Hangul Syllable')) {
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
			var codepoint = parseInt(data_line[0], 16);
			global_data[codepoint] = data_line[1];
			global_category[codepoint] = data_line[2];
			if (global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint >= codepoint - 1) {
				++global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint;
			} else {
				global_all_assigned_ranges.push({startCodepoint: codepoint, endCodepoint: codepoint});
			}
		}
	}, completion);
}

function decompomposeHangulSyllable(codepoint: number): number[] {
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

function getName(codepoint: number, search: boolean = false): string {
	let d = global_data[codepoint];
	if (d) {
		if (d[0] != '<')
			return d;
		else
			return '';
	}
	if (0xAC00 <= codepoint && codepoint <= 0xD7AF) {
		var decomposedSyllables = decompomposeHangulSyllable(codepoint);
		var shortJamoNames: string[] = [];
		for (let i = 0; i < decomposedSyllables.length; ++i)
			shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
		return 'HANGUL SYLLABLE ' + shortJamoNames.join('');
	}
	if ((0x3400 <= codepoint && codepoint <= 0x4DBF) ||
		(0x4E00 <= codepoint && codepoint <= 0x9FFF)) {
		if (search)
			return 'CJK UNIFIED IDEOGRAPH';
		return 'CJK UNIFIED IDEOGRAPH-' + itos(codepoint, 16, 4);
	}
	for (let i = 0; i < global_ranges.length; ++i) {
		var range = global_ranges[i];
		if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
			if (range.rangeName.startsWith('CJK Ideograph')) {
				if (search)
					return 'CJK UNIFIED IDEOGRAPH';
				return 'CJK UNIFIED IDEOGRAPH-' + itos(codepoint, 16, 4);
			}
		}
	}
	return '';
}

function getHtmlNameDescription(codepoint: number): string {
	if (getName(codepoint) !== '')
		return getName(codepoint);
	if (global_data[codepoint] == '<control>') {
		var name: string[] = [];
		for (var i = 0; i < global_aliases.length; ++i) {
			if (global_aliases[i].codepoint == codepoint) {
				if (global_aliases[i].type != 'control' && name.length > 0)
					break;
				name.push(global_aliases[i].alias);
				if (global_aliases[i].type != 'control')
					break;
			}
		}
		if (name.length > 0)
			return '<i>' + name.join(' / ') + '</i>';
	}
	return '<i>Unknown-' + itos(codepoint, 16, 4) + '</i>';
}

function getUnicodeDataTxtNameField(codepoint: number): string {
	if (global_data[codepoint])
		return global_data[codepoint];
	for (var i = 0; i < global_ranges.length; ++i) {
		var range = global_ranges[i];
		if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint)
			return range.rangeName;
	}
	return 'Unknown';
}
