window.graphemeBreakData = [];

function initGraphemeData(completion) {
	var client = new XMLHttpRequest();
	client.open('GET', 'GraphemeBreakProperty.txt');
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var lines = client.responseText.split('\n');
			for (var i in lines) {
				var line = lines[i];
				if (line == '' || line[0] == '#')
					continue;
				var state = 1;
				var startCodePoint = '';
				var endCodePoint = '';
				var value = '';
				for (var j in line) {
					var c = line[j];
					if (c == '#')
						break;
					if (state == 1) {
						if (c != '.' && c != ' ') {
							startCodePoint += c;
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
							endCodePoint += c;
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
				startCodePoint = parseInt('0x' + startCodePoint);
				endCodePoint = endCodePoint == '' ? startCodePoint : parseInt('0x' + endCodePoint);
				for (var x = startCodePoint; x <= endCodePoint; ++x) {
					window.graphemeBreakData[x] = value;
				}
			}
			completion();
		}
	}
	client.send();
}

function graphemeBreakValueForCodepoint(codepoint) {
	if (window.graphemeBreakData[codepoint])
		return window.graphemeBreakData[codepoint];
	return 'Other';
}

function countGraphemesForCodepoints(codepoints, useExtended) {
	// codepoints [1, 2, 3, 4, 5]
	// break before [true, true, true, true, true, true]
	var values = [];
	for (var i in codepoints) {
		values.push(graphemeBreakValueForCodepoint(codepoints[i]));
	}
	var breaks = [];
	for (var i = 0; i <= codepoints.length; ++i) // GB10
		breaks.push(true);

	if (useExtended) {
		for (var i in values) {
			if (values[i] == 'SpacingMark')
				breaks[i] = false; // GB9a
			if (values[i] == 'Prepend')
				breaks[parseInt(i)+1] = false; // GB9b
		}
	}

	for (var i in values) {
		if (values[i] == 'Extend')
			breaks[i] = false; // GB9
	}

	for (var i in values) {
		if (values[i] == 'Regional_Indicator' 
			&& parseInt(i) + 1 < values.length 
			&& values[parseInt(i)+1] == 'Regional_Indicator')
			breaks[parseInt(i)+1] = false; // GB8a
	}

	for (var i in values) {
		if (values[i] == 'L' && parseInt(i) + 1 < values.length && 
			      (values[parseInt(i)+1] == 'L' 
				|| values[parseInt(i)+1] == 'V' 
				|| values[parseInt(i)+1] == 'LV' 
				|| values[parseInt(i)+1] == 'LVT'))
			breaks[parseInt(i)+1] = false; // GB8
		if ((values[i] == 'LV' || values[i] == 'V') && parseInt(i) + 1 < values.length && 
			      (values[parseInt(i)+1] == 'V' 
				|| values[parseInt(i)+1] == 'T'))
			breaks[parseInt(i)+1] = false; // GB7
		if ((values[i] == 'LVT' || values[i] == 'T') && parseInt(i) + 1 < values.length && 
			      (values[parseInt(i)+1] == 'T'))
			breaks[parseInt(i)+1] = false; // GB6
	}
	for (var i in values) {
		if (values[i] == 'CR' && parseInt(i) + 1 < values.length && values[parseInt(i)+1] == 'LF')
			breaks[parseInt(i)+1] = false; // GB3
	}

	var count = -1;
	for (var i in breaks) {
		if (breaks[i])
			++count;
	}
	return count;
}
