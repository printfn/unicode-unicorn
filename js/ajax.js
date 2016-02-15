function requestAsync(url, before, each, after) {
	var client = new XMLHttpRequest();
	client.open('GET',  url);
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var lines = client.responseText.split('\n');
			if (before)
				before(lines);
			if (each) {
				for (var i = 0; i < lines.length; ++i) {
					var line = lines[i];
					if (line.length == 0 || line[0] == '#')
						continue;
					if (line.indexOf('#') != -1) {
						line = line.substring(0, line.indexOf('#'));
					}
					each(line);
				}
			}
			if (after) {
				after();
			}
		}
	}
	client.send();
}

function callMultipleAsync(functions, completion) {
	var count = 0;
	var callback = function() {
		++count;
		if (count == functions.length) {
			completion();
		}
	}
	for (var i = 0; i < functions.length; ++i) {
		functions[i](callback);
	}
}