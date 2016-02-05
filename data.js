window.data = [];
window.ranges = [];

function getCodepointDescription(codepoint, name) {
	codepoint = parseInt(codepoint);
	return name + ' ' + ctos([codepoint]);
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
		return window.data[codepoint] + getHanEntry(codepoint);
	for (var i in window.ranges) {
		var range = window.ranges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return range[2](codepoint) + getHanEntry(codepoint);
	}
	return getCodepointDescription(codepoint, 'Unknown') + getHanEntry(codepoint);
}

function getSearchString(codepoint) {
	return getUnicodeData(codepoint).toUpperCase();
}

function searchCodepoints(str) {
	var results = [];

	var deduplicate = function(a) {
		var temp = {};
		for (var i = 0; i < a.length; i++)
			temp[a[i]] = true;
		var r = [];
		for (var k in temp)
			r.push(parseInt(k));
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
	if (str.startsWith('U+')) {
		str = str.replace('U+', '');
	}

	for (var codepoint in window.data) {
		var searchString = getSearchString(codepoint);
		if (searchString.includes(str) || codepoint.includes(str)) {
			results.push(parseInt(codepoint));
			if (reachedMaxResults())
				break;
		}
	}
	if (!reachedMaxResults() || codepoint > 0x3400) {
		for (var codepoint in window.han_meanings) {
			var searchString = getSearchString(codepoint);
			if (searchString.includes(str) || codepoint.includes(str)) {
				results.push(parseInt(codepoint));
				if (reachedMaxResults())
					break;
			}
		}
	}
	results = deduplicate(results);
	return results;
}