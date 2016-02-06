window.data = [];
window.ranges = [];
window.category = [];
window.categoryRanges = [];

function getCharacterCategoryName(codepoint) {
	if (window.category[codepoint])
		return window.category[codepoint];
	for (var i = 0; i < window.categoryRanges.length; ++i) {
		var range = window.categoryRanges[i];
		if (codepoint >= range[0] && codepoint <= range[1])
			return range[2];
	}
	return 'Unknown';
}

function getCodepointDescription(codepoint, name) {
	codepoint = parseInt(codepoint);
	return name + ' ' + ctos([codepoint]);
}

function getRangeFunctionForName(name) {
	return function(codepoint) {
		return getCodepointDescription(codepoint, name);
	}
}

function initAliasData(completion) {
	var client = new XMLHttpRequest();
	client.open('GET', 'UCD/NameAliases.txt');
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var dataStrings = client.responseText.split('\n');
			window.aliases = [];
			window.controlAliases = [];
			for (var i = 0; i < dataStrings.length; ++i) {
				if (dataStrings[i].length == 0 || dataStrings[i][0] == '#')
					continue;
				var splitLine = dataStrings[i].split(';');
				var codepoint = parseInt('0x' + splitLine[0]);
				var alias = splitLine[1];
				window.aliases.push({codepoint: codepoint, alias: alias});
				if (splitLine[2] == 'control')
					window.controlAliases.push({codepoint: codepoint, alias: alias});
			}
			completion();
		}
	}
	client.send();
}

function initGeneralCategoryNames(completion) {
	var client = new XMLHttpRequest();
	client.open('GET', 'UCD/PropertyValueAliases.txt');
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var dataStrings = client.responseText.split('\n');
			window.generalCategoryNames = [];
			for (var i = 0; i < dataStrings.length; ++i) {
				if (dataStrings[i].length == 0)
					continue;
				var splitLine = dataStrings[i].split('#');
				splitLine = splitLine[0];
				splitLine = splitLine.split(';');
				if (splitLine[0].trim() != 'gc')
					continue;
				var gc = splitLine[1].trim();
				var gcAlias = splitLine[2].trim();
				window.generalCategoryNames[gc] = gcAlias.replace('_', ' ');
			}
			completion();
		}
	}
	client.send();
}

function initUnicodeData(completion) {
	initAliasData(function() {
		initGeneralCategoryNames(function() {
			var client = new XMLHttpRequest();
			client.open('GET', 'UCD/UnicodeData.txt');
			client.onreadystatechange = function() { 
				if (client.readyState == 4 && client.status == 200) {
					var dataStrings = client.responseText.split('\n');
					window.data = [];
					for (var i = 0; i < dataStrings.length; ++i) {
						if (dataStrings[i].length == 0)
							continue;
						var data_line = dataStrings[i].split(';');
						if (data_line[1].endsWith(', First>')) {
							var startCodePoint = parseInt('0x' + data_line[0]);
							var endCodePoint = parseInt('0x' + dataStrings[i+1].split(';')[0]);
							window.ranges.push([
								startCodePoint,
								endCodePoint,
								getRangeFunctionForName(data_line[1].substring(1, data_line[1].length - 8))
							]);
							window.categoryRanges.push([
								startCodePoint,
								endCodePoint,
								window.generalCategoryNames[data_line[2]]
							]);
						} else if (data_line[1].endsWith(', Last>')) {
							continue;
						} else if (data_line[1] == '<control>') {
							var name = [];
							var codepoint = parseInt('0x' + data_line[0]);
							for (var j = 0; j < window.controlAliases.length; ++j) {
								if (window.controlAliases[j].codepoint == codepoint) {
									name.push(window.controlAliases[j].alias);
								}
							}
							var nameString = name.length > 0 ? '<control> (' + name.join(' / ') + ')' : '<control>'
							window.data[parseInt('0x' + data_line[0])] = getCodepointDescription(
								'0x' + data_line[0],
								nameString
							);
							window.category[parseInt('0x' + data_line[0])] = window.generalCategoryNames[data_line[2]];
						} else {
							window.data[parseInt('0x' + data_line[0])] = getCodepointDescription('0x' + data_line[0], data_line[1]);
							window.category[parseInt('0x' + data_line[0])] = window.generalCategoryNames[data_line[2]];
						}
					}
					completion();
				}
			}
			client.send();
		});
	});
}

function getUnicodeData(codepoint) {
	if (window.data[codepoint])
		return window.data[codepoint] + getHanEntry(codepoint);
	for (var i = 0; i < window.ranges.length; ++i) {
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

	for (var codepoint in window.data) {
		var searchString = getSearchString(codepoint);
		if (searchString.includes(str)) {
			results.push(parseInt(codepoint));
			if (reachedMaxResults())
				break;
		}
	}
	for (var i = 0; i < window.aliases.length; ++i) {
		var searchString = window.aliases[i].alias;
		if (searchString.includes(str)) {
			results.push(window.aliases[i].codepoint);
		}
	}
	if (!reachedMaxResults() || codepoint > 0x3400) {
		for (var codepoint in window.han_meanings) {
			var searchString = getSearchString(codepoint);
			if (searchString.includes(str)) {
				results.push(parseInt(codepoint));
				if (reachedMaxResults())
					break;
			}
		}
	}
	results = deduplicate(results);
	return results;
}