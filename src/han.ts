var global_han_meanings: { [codepoint: number]: string; } = [];
var global_mandarin_readings: { [codepoint: number]: string; } = [];
var global_kun_readings: { [codepoint: number]: string; } = [];
var global_on_readings: { [codepoint: number]: string; } = [];

function initHanData(completion: () => void) {
	requestAsync('data/Unicode/Unihan/Unihan_Readings.txt', undefined, function(line) {
		var fields = line.split('\t');
		var codepoint = parseInt(fields[0].substring(2), 16);
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
