function initHanData(completion) {
	requestAsync('Unihan/Unihan_Readings.txt', function() {
		han_meanings = [];
		han_meanings_search = [];
	}, function(line) {
		var fields = line.split('\t');
		if (fields[1] != 'kDefinition')
			return;
		han_meanings[parseInt('0x' + fields[0].substring(2))] = fields[2];
		han_meanings_search[parseInt('0x' + fields[0].substring(2))] = fields[2].toUpperCase();
	}, completion);
}

function getHanEntry(codepoint, prefix) {
	if (typeof prefix == 'undefined')
		var prefix = ' - ';
	if (han_meanings[codepoint])
		return prefix + han_meanings[codepoint];
	return '';
}

function getSearchHanEntry(codepoint) {
	if (han_meanings_search[codepoint])
		return ' - ' + han_meanings_search[codepoint];
	return '';
}
