function initHanData(completion) {
	requestAsync('Unihan/Unihan_Readings.txt', function(lines) {
		window.han_meanings = [];
		for (var i = 0; i < lines.length; ++i) {
			var fields = lines[i].split('\t');
			if (fields[1] != 'kDefinition')
				continue;
			window.han_meanings[parseInt('0x' + fields[0].substring(2))] = fields[2];
		}
		completion();
	});
}

function getHanEntry(codepoint) {
	if (window.han_meanings[codepoint])
		return ' - ' + window.han_meanings[codepoint];
	return '';
}