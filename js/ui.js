// codepoints is an int array, 
// tableId a string to a <table class="table table-striped">
// and buttons is an array of {
//   displayName: "Display name",
//   functionName: "function name",
//   require: function(idx, length) -> bool
// },
//   where each function name refers to a function taking a codepoint and an index into `codepoints`
function renderCodepointsInTable(codepoints, tableId, buttons) {
	var table = $('#' + tableId);
	if (codepoints.length == 0) {
		table.html('');
		return;
	}
	var html = ('<thead>'
	    + '<tr><th></th><th>Codepoint (Hex)</th><th>Codepoint (Decimal)</th><th>Category</th><th>Description</th></tr>'
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
		    + '<td>' + getCharacterCategoryName(codepoint) + '</td>'
		    + '<td>' + escapeHtml(getUnicodeData(codepoint)) + '</td>'
		    + '</tr>';
	}
	if (i >= 256) {
		html += '<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>';
	}
	html += '</tbody>';
	table.html(html);
}

function randomColorForKey(key) {
	if (!window.colorMap)
		window.colorMap = [];
	if (window.colorMap[key])
		return window.colorMap[key];
	var color = randomColor({
		luminosity: 'light'
	});
	window.colorMap[key] = color;
	return color;
}

function updateRenderedCodepage() {
	var encoding = $('#codepageEncoding option:selected').text();
	var ascii = false;
	if (encoding == 'ASCII') {
		encoding = 'ISO-8859-1 ("Latin-1")';
		ascii = true;
	}
	var mapping = getSingleByteMappingForEncoding(encoding);
	var html = '<thead><th></th>';
	for (var i = 0; i < 16; ++i)
		html += '<th>_' + i.toString(16).toUpperCase() + '</th>';
	html += '</thead><tbody>';
	for (var i = 0; i < (ascii ? 8 : 16); ++i) {
		html += '<tr><td style="font-weight:bold">' + i.toString(16).toUpperCase() + '_</td>';
		for (var j = 0; j < 16; ++j) {
			var byte = (i << 4) + j;
			var codepoint = codepointForByteUsingMapping(mapping, byte);
			var str = escapeHtml(ctos([codepoint]));
			var color = randomColorForKey(getCharacterCategoryName(codepoint));
			html += '<td style="cursor: pointer; background-color: ' + color + ';" onclick="showCodepageDetail(' + codepoint + ')">' 
				+ i.toString(16).toUpperCase() 
				+ j.toString(16).toUpperCase() 
				+ '<br>' 
				+ str 
				+ '</td>';
		}
		html += '</tr>';
	}
	html += '</tbody>';
	$('#codepage').html(html);
}

function showCodepageDetail(codepoint) {
	$('#detail-codepoint').text(itos(codepoint, 16, 4));
	$('#detail-name').text(getUnicodeData(codepoint));
	$('#detail-category').text(getCharacterCategoryName(codepoint));
	var aliases = [];
	for (var i = 0; i < window.aliases.length; ++i) {
		if (window.aliases[i].codepoint == codepoint)
			aliases.push(window.aliases[i].alias);
	}
	if (aliases.length == 0) {
		$('#detail-aliases').hide();
	} else {
		$('#detail-aliases').show();
		$('#detail-aliases-list').text(aliases.join(', '));
	}
	$('#codepoint-detail').modal('show');
}
