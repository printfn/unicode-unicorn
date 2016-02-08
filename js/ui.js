// codepoints is an int array, 
// tableId a string to a <table class="table table-striped">
// and buttons is an array of {
//   displayName: "Display name",
//   functionName: "function name",
//   require: function(idx, length) -> bool
// }, where each function name refers to a function taking a codepoint and an index into `codepoints`
function renderCodepointsInTable(codepoints, tableId, buttons) {
	var table = $('#' + tableId);
	if (codepoints.length == 0) {
		table.html('');
		return;
	}
	var html = ('<thead>'
	    + '<tr><th></th><th>Codepoint (Hex)</th><th>Codepoint (Decimal)</th><th>Character</th><th>Category</th><th>Name</th></tr>'
	    + '</thead><tbody>');
	for (var i = 0; i < codepoints.length; ++i) {
		var codepoint = codepoints[i];
		var buttonStr = '';
		for (var j in buttons) {
			var buttonDescription = buttons[j];
			var disabled = '';
			if (buttonDescription.require) {
				if (!buttonDescription.require(i, codepoints.length)) {
					disabled = 'disabled '
				}
			}
			buttonStr += '<input type="button" ' + disabled + 'onclick="' + buttonDescription.functionName + '(' + codepoint + ', ' + i + ')" value="'
			    + buttonDescription.displayName 
			    + '">';
		}
		html += '<tr>'
		    + '<td>' + buttonStr + '</td>'
		    + '<td>U+' + itos(codepoint, 16, 4) + '</td>'
		    + '<td>' + codepoint + '</td>'
		    + '<td>' + displayCodepoint(codepoint) + '</td>'
		    + '<td>' + getCharacterCategoryName(codepoint) + '</td>'
		    + '<td style="cursor: pointer;" onclick="showCodepageDetail(' + codepoint + ')">' + getHtmlNameDescription(codepoint) + '</td>'
		    + '</tr>';
	}
	if (i >= 256) {
		html += '<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>';
	}
	html += '</tbody>';
	table.html(html);
}

function randomColorForKey(key) {
	if (typeof colorMap == 'undefined')
		colorMap = [];
	if (colorMap[key])
		return colorMap[key];
	var color = randomColor({
		luminosity: 'light'
	});
	colorMap[key] = color;
	return color;
}

function updateRenderedCodepage() {
	var encoding = $('#codepageEncoding option:selected').text();
	var mapping = mappings[encoding];
	var ascii = isMapping7Bit(mapping);
	var html = '<thead><th></th>';
	for (var i = 0; i < 16; ++i)
		html += '<th>_' + i.toString(16).toUpperCase() + '</th>';
	html += '</thead><tbody>';
	for (var i = 0; i < (ascii ? 8 : 16); ++i) {
		html += '<tr><td style="font-weight:bold">' + i.toString(16).toUpperCase() + '_</td>';
		for (var j = 0; j < 16; ++j) {
			var byte = (i << 4) + j;
			var codepoint = codepointForByteUsingMapping(mapping, byte);
			var color = randomColorForKey(getCharacterCategoryName(codepoint));
			var displayedCodepoint = displayCodepoint(codepoint);
			if (displayedCodepoint) {
				html += '<td style="cursor: pointer; background-color: ' + color + ';" onclick="showCodepageDetail(' + codepoint + ')">' 
					+ i.toString(16).toUpperCase()
					+ j.toString(16).toUpperCase()
					+ '<br>'
					+ displayedCodepoint
					+ '</td>';
			} else {
				html += '<td style="background-color: white">' + i.toString(16).toUpperCase() + j.toString(16).toUpperCase() + '<br>&nbsp;</td>';
			}
		}
		html += '</tr>';
	}
	html += '</tbody>';
	$('#codepage').html(html);
}

function showCodepageDetail(codepoint) {
	$('#detail-codepoint-hex').text(itos(codepoint, 16, 4));
	$('#detail-codepoint-decimal').text(codepoint);
	$('#detail-name').html('"' + getName(codepoint) + '"');
	$('#detail-character').html(displayCodepoint(codepoint));
	$('#detail-category').text(getCharacterCategoryCode(codepoint) + ' (' + getCharacterCategoryName(codepoint) + ')');
	$('#detail-block').text(getBlockForCodepoint(codepoint).replace('_', ' '));
	$('#detail-script').text(getScriptForCodepoint(codepoint).replace('_', ' '));
	var aliases = [];
	for (var i = 0; i < aliases.length; ++i) {
		if (aliases[i].codepoint == codepoint)
			aliases.push(aliases[i].alias);
	}
	if (aliases.length == 0) {
		$('#detail-aliases').hide();
	} else {
		$('#detail-aliases').show();
		$('#detail-aliases-list').text(aliases.join(', '));
	}
	var meaning = getHanEntry(codepoint, '');
	if (meaning.length == 0) {
		$('#detail-meaning').hide();
	} else {
		$('#detail-meaning').show();
		$('#detail-meaning-content').text(meaning);
	}
	var mandarin = mandarin_readings[codepoint];
	if (mandarin) {
		$('#detail-mandarin').show();
		$('#detail-mandarin-content').text(mandarin);
	} else {
		$('#detail-mandarin').hide();
	}
	var kun = kun_readings[codepoint];
	if (kun) {
		$('#detail-kun').show();
		$('#detail-kun-content').text(kun);
	} else {
		$('#detail-kun').hide();
	}
	var on = on_readings[codepoint];
	if (on) {
		$('#detail-on').show();
		$('#detail-on-content').text(on);
	} else {
		$('#detail-on').hide();
	}
	var encodingsString = '';
	$('#outputEncoding option').each(function(i, e) {
		var encoding = $(e).text();
		var html = encodeOutput(
			$('#byteOrderMark option:selected').text(),
			encoding,
			$('#outputFormat option:selected').text(),
			$('#outputJoiner option:selected').text(),
			[codepoint]
		);
		if (html.startsWith('<span'))
			return;
		encodingsString += encoding + ': ' + html + '\n';
	});

	$('#detail-encoding-outputs').text(encodingsString);
	$('#codepoint-detail').modal('show');
}
