var global_languageData: string[] = [];

function initLanguageData(completion: () => void) {
	var parseLanguageData = function(lines: string[]) {
		var languageTags: { code: string; name: string; type: string; }[] = [];
		var entries = lines.join('\n').split('\n%%\n');
		for (let i = 0; i < entries.length; ++i) {
			var fieldsStrings = entries[i].split('\n');
			var fields: { [key: string]: string; } = {};
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

			if (!$('#showRareLanguages')[0].hasAttribute('disabled') && fields['Type'] == 'language' && fields['Subtag'].length > 2)
				continue;

			languageTags.push({
				code: fields['Subtag'],
				name: fields['Description'],
				type: fields['Type']
			});
		}
		languageTags.sort(function(a, b) {
			return a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
		});
		var htmls: { [key: string]: string; } = {};
		for (let i = 0; i < languageTags.length; ++i) {
			if (!htmls[languageTags[i].type])
				htmls[languageTags[i].type] = '<option data-code="">None / Default</option>';
			htmls[languageTags[i].type] += '<option data-code="' + languageTags[i].code + '">' + languageTags[i].name + ' (' + languageTags[i].code + ')</option>';
		}
		updateSelectOptions('#languageList', htmls['language']);
		updateSelectOptions('#scriptList', htmls['script']);
		updateSelectOptions('#regionList', htmls['region']);
		updateSelectOptions('#variantList', htmls['variant']);
		$('#showRareLanguages').on('click', function() {
			$('#showRareLanguages').attr('disabled', 'disabled');
			parseLanguageData(global_languageData);
		});
		completion();
	};
	requestAsync('data/language-subtag-registry', function(lines) {
		global_languageData = lines;
		parseLanguageData(lines);
	});
}