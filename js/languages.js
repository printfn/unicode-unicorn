function initLanguageData(completion) {
	requestAsync('language-subtag-registry', function(lines) {
		var languageTags = [];
		var entries = lines.join('\n').split('\n%%\n');
		for (var i = 0; i < entries.length; ++i) {
			var fieldsStrings = entries[i].split('\n');
			var fields = {};
			for (var j = 0; j < fieldsStrings.length; ++j) {
				var kv = fieldsStrings[j].split(': ');
				if (!fields[kv[0]])
					fields[kv[0]] = kv[1];
				else
					fields[kv[0]] += ' / ' + kv[1];
			}

			if (!fields['Type']) continue;
			if (fields['Type'] == 'grandfathered') continue;
			if (fields['Type'] == 'redundant') continue;
			// there is a lang value for every valid lang+extlang combination
			if (fields['Type'] == 'extlang') continue;

			if (!fields['Subtag'] || !fields['Description'])
				throw 'Invalid Format';
			languageTags.push({
				code: fields['Subtag'],
				name: fields['Description'],
				type: fields['Type']
			});
		}
		var htmls = {};
		for (var i = 0; i < languageTags.length; ++i) {
			if (!htmls[languageTags[i].type])
				htmls[languageTags[i].type] = '<option data-code="">None / Default / Not Applicable</option>';
			htmls[languageTags[i].type] += '<option data-code="' + languageTags[i].code + '">' + languageTags[i].code + ' - ' + languageTags[i].name + '</option>';
		}
		$('#languageList').html(htmls['language']);
		$('#scriptList').html(htmls['script']);
		$('#regionList').html(htmls['region']);
		$('#variantList').html(htmls['variant']);
		completion();
	});
}