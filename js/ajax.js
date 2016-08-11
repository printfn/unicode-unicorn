function loadUnicodeData(completion) {
	DataZip = new JSZip();
	JSZipUtils.getBinaryContent('data.zip', function(err, data) {
		if (err) {
			throw err;
		}
		DataZip.loadAsync(data).then(function() {
			completion();
		});
	});
}

function requestAsync(url, before, each, after) {
	console.log(url);
	DataZip.file(url).async('string').then(function(str) {
		var lines = str.split('\n');
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
	});
}

function deleteUnicodeData() {
	delete DataZip;
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