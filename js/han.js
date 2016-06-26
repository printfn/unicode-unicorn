global_han_meanings = [];
global_mandarin_readings = [];
global_kun_readings = [];
global_on_readings = [];

function initHanData(completion) {
	requestAsync('data/Unicode/Unihan/Unihan_Readings.txt', null, function(line) {
		var fields = line.split('\t');
		var codepoint = parseInt('0x' + fields[0].substring(2));
		if (fields[1] == 'kDefinition') {
			global_han_meanings[codepoint] = fields[2];
		} else if (fields[1] == 'kMandarin') {
			global_mandarin_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		} else if (fields[1] == 'kJapaneseKun') {
			global_kun_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		} else if (fields[1] == 'kJapaneseOn') {
			global_on_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, ', ');
		}
	}, completion);
}
