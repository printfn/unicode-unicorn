function requestAsync(url, completion) {
	var client = new XMLHttpRequest();
	client.open('GET',  url);
	client.onreadystatechange = function() { 
		if (client.readyState == 4 && client.status == 200) {
			var lines = client.responseText.split('\n');
			completion(lines);
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