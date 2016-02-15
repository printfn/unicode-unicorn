global_graphemeBreakData = [];

function initGraphemeData(completion) {
	requestAsync('UCD/auxiliary/GraphemeBreakProperty.txt', function() {}, function(line) {
		var state = 1;
		var startCodepoint = '';
		var endCodepoint = '';
		var value = '';
		for (var j in line) {
			var c = line[j];
			if (c == '#')
				break;
			if (state == 1) {
				if (c != '.' && c != ' ') {
					startCodepoint += c;
					continue;
				} else {
					state = 2;
				}
			}
			if (state == 2) {
				if (c == ' ') {
					state = 3;
				} else if (c == '.') {
					continue;
				} else {
					endCodepoint += c;
					continue;
				}
			}
			if (state == 3) {
				if (c == ' ')
					continue;
				else if (c == ';') {
					state = 4;
					continue;
				}
			}
			if (state == 4) {
				if (c == ' ') {
					continue;
				} else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
					value += c;
					continue;
				} else
					break;
			}
		}
		startCodepoint = parseInt('0x' + startCodepoint);
		endCodepoint = endCodepoint == '' ? startCodepoint : parseInt('0x' + endCodepoint);
		for (var x = startCodepoint; x <= endCodepoint; ++x) {
			global_graphemeBreakData[x] = value;
		}
	}, completion);
}

function graphemeBreakValueForCodepoint(codepoint) {
	if (global_graphemeBreakData[codepoint])
		return global_graphemeBreakData[codepoint];
	return 'Other';
}

function countGraphemesForCodepoints(codepoints, useExtended) {
	if (codepoints.length == 0)
		return 0;
	
	var breaks = 0;
	for (var i = 1; i < codepoints.length; ++i) {
		// increment `breaks` if we should break between codepoints[i-1] and codepoints[i]
		var value1 = graphemeBreakValueForCodepoint(codepoints[i-1]);
		var value2 = graphemeBreakValueForCodepoint(codepoints[i]);

		// see http://unicode.org/reports/tr29/#Grapheme_Cluster_Boundary_Rules for descriptions of grapheme cluster boundary rules
		// skip rules GB1 and GB2 as they deal with SOT and EOT and thus don't affect the number of graphemes in a string

		if (value1 == 'CR' && value2 == 'LF') { // GB3

		} else if (value1 == 'Control' || value1 == 'CR' || value1 == 'LF') { // GB4
			++breaks;
		} else if (value2 == 'Control' || value2 == 'CR' || value2 == 'LF') { // GB5
			++breaks;
		} else if (value1 == 'L' && (value2 == 'L' || value2 == 'V' || value2 == 'LV' || value2 == 'LVT')) { // GB6

		} else if ((value1 == 'LV' || value1 == 'V') && (value2 == 'V' || value2 == 'T')) { // GB7

		} else if ((value1 == 'LVT' || value1 == 'T') && value2 == 'T') { // GB8

		} else if (value1 == 'Regional_Indicator' && value2 == 'Regional_Indicator') { // GB8a

		} else if (value2 == 'Extend') { // GB9

		} else if (useExtended && value2 == 'SpacingMark') { // GB9a

		} else if (useExtended && value1 == 'Prepend') { // GB9b

		} else { // GB10
			++breaks;
		}
	}
	return breaks + 1;
}
