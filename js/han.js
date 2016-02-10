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
			mandarin_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		} else if (fields[1] == 'kJapaneseKun') {
			kun_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		} else if (fields[1] == 'kJapaneseOn') {
			on_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		}
	}, completion);
}
