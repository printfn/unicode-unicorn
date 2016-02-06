function initHanData(completion) {
	var client = new XMLHttpRequest();
	client.open('GET', 'Unihan/Unihan_Readings.txt');
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var dataStrings = client.responseText.split('\n');
			window.han_meanings = [];
			for (var i = 0; i < dataStrings.length; ++i) {
				var fields = dataStrings[i].split('\t');
				if (fields[1] != 'kDefinition')
					continue;
				window.han_meanings[parseInt('0x' + fields[0].substring(2))] = fields[2];
			}
			completion();
		}
	}
	client.send();
}

function getHanEntry(codepoint) {
	if (window.han_meanings[codepoint])
		return ' - ' + window.han_meanings[codepoint];
	return '';
}