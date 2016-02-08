function initHanData(completion) {
	requestAsync('Unihan/Unihan_Readings.txt', function() {
		han_meanings = [];
		han_meanings_search = [];
		mandarin_readings = [];
		kun_readings = [];
		on_readings = [];
	}, function(line) {
		var fields = line.split('\t');
		var codepoint = parseInt('0x' + fields[0].substring(2));
		if (fields[1] == 'kDefinition') {
			han_meanings[codepoint] = fields[2];
			han_meanings_search[codepoint] = fields[2].toUpperCase();
		} else if (fields[1] == 'kMandarin') {
			mandarin_readings[codepoint] = fields[2].toLowerCase().replace(' ', ', ');
		} else if (fields[1] == 'kJapaneseKun') {
			kun_readings[codepoint] = fields[2].toLowerCase().replace(' ', ', ');
		} else if (fields[1] == 'kJapaneseOn') {
			on_readings[codepoint] = fields[2].toLowerCase().replace(' ', ', ');
		}
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
		return ' - ' + han_meanings_search[codepoint] + (kun_readings[codepoint] || '').toUpperCase() + (on_readings[codepoint] || '').toUpperCase();
	return '';
}
