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