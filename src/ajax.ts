declare var JSZipUtils: { getBinaryContent(url: string, callback: (err: Error, data: ArrayBuffer) => void): void; };
var DataZip = new JSZip();

function loadBinaryData(url: string, progress: (progress: number) => void, completion: (err: Error, data: ArrayBuffer) => void) {
	var req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.responseType = 'arraybuffer';

	req.onload = function () {
		var arrayBuffer = req.response;
		if (arrayBuffer) {
			completion(null, arrayBuffer);
		} else {
			JSZipUtils.getBinaryContent(url, completion);
		}
	};
	req.onprogress = function (event) {
		if (!event.lengthComputable) {
			return;
		}
		progress(event.loaded / event.total);
	};
	req.send(null);
}

function loadUnicodeData(completion: () => void) {
	loadBinaryData('data.zip', (progress) => {
		$('#ajaxLoadingProgressBar').val(progress);
	}, (err, data) => {
		if (err) {
			throw err;
		}
		DataZip.loadAsync(data).then(function() {
			completion();
		});
	});
}

function requestAsync(url: string, before?: (lines: string[]) => void, each?: (line: string) => void, after?: () => void) {
	DataZip.file(url).async('string').then(function(str: string) {
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
	});
}

function deleteUnicodeData() {
	DataZip = null;
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