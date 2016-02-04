window.data = [];
window.ranges = [];

function getCodepointDescription(codepoint, name) {
	codepoint = parseInt(codepoint);
	return 'U+' + codepoint.toString(16).toUpperCase() + ' (' + codepoint + ') - ' + name + ' ' + ctos([codepoint]);
}

function mergeNewAndLegacyNames(data_file_name, data_file_legacy_name) {
	if (data_file_legacy_name && data_file_legacy_name != '')
		return data_file_name + ' (' + data_file_legacy_name + ')';
	return data_file_name;
}

function getRangeFunctionForName(name) {
	return function(codepoint) {
		return getCodepointDescription(codepoint, name);
	}
}

function initUnicodeData(completion) {
	var client = new XMLHttpRequest();
	client.open('GET', 'UnicodeData.txt');
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var dataStrings = client.responseText.split('\n');
			window.data = [];
			for (var i in dataStrings) {
				var data_line = dataStrings[i].split(';');
				if (data_line[1].endsWith(', First>')) {
					window.ranges.push([
						parseInt('0x' + data_line[0]),
						parseInt('0x' + dataStrings[parseInt(i)+1].split(';')[0]),
						getRangeFunctionForName(data_line[1].substring(1, data_line[1].length - 8))
					]);
				} else if (data_line[1].endsWith(', Last>')) {
					continue;
				} else {
					window.data[parseInt('0x' + data_line[0])] = getCodepointDescription(
						'0x' + data_line[0],
						mergeNewAndLegacyNames(data_line[1], data_line[10])
					);
				}
			}
			completion();
		}
	}
	client.send();
}

function getUnicodeData(codepoint) {
	if (window.data[codepoint])
		return window.data[codepoint];
	for (var i in window.ranges) {
		var range = window.ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return range[2](codepoint);
	}
	return getCodepointDescription(codepoint, 'Unknown');
}

function searchCodepoints(str) {
	// if (str == '')
	// 	return [];

	var names = [];

	str = str.toUpperCase();

	for (var codepoint in window.data) {
		var name = getUnicodeData(codepoint);
		if (name.includes(str)) {
			names.push(name);
			if (names.length >= 256)
				break;
		}
	}
	return names;
}