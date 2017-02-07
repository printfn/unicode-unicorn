function requestAsync(url: string, before?: (lines: string[]) => void, each?: (line: string) => void, after?: () => void) {
	var req = new XMLHttpRequest();
	req.open('GET', url, true);

	req.onload = function () {
		var str = req.response;
		var lines = str.split('\n');
		if (before)
			before(lines);
		if (each) {
			for (var i = 0; i < lines.length; ++i) {
				var line = lines[i];
				if (line.length === 0 || line[0] == '#')
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
	};
	req.send(null);
}

function callMultipleAsync(functions: ((callback: () => void) => void)[], completion: () => void) {
	var count = 0;
	var callback = function() {
		++count;
		if (count == functions.length) {
			completion();
		}
	};
	for (var i = 0; i < functions.length; ++i) {
		functions[i](callback);
	}
}