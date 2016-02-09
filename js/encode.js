var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

function escapeHtml(string) {
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}

function displayCodepoint(codepoint) {
	if (typeof codepoint == 'undefined')
		return;
	if (codepoint < 0x20)
		codepoint += 0x2400;
	if (codepoint == 0x7F)
		codepoint = 0x2421;
	codepoints = [codepoint];
	if (graphemeBreakValueForCodepoint(codepoint) == 'Extend')
		codepoints = [0x25CC, codepoint];
	return escapeHtml(ctos(codepoints));
}

function ctos(array) {
	return punycode.ucs2.encode(array);
}

function stoc(string) {
	return punycode.ucs2.decode(string);
}

function itos(int, base, padding) {
	var res = int.toString(base).toUpperCase();
	if (padding) {
		while (res.length < padding) {
			res = '0' + res;
		}
	}
	return res;
}

function applySingleByteMapping(mapping, codepoint) {
	codepoint = parseInt(codepoint);
	var number = mapping[codepoint];
	if (typeof number == 'undefined')
		return;
	if (number <= 0xFF)
		return [number];
	return [number >> 8, number & 0xFF];
}

function codepointForByteUsingMapping(mapping, byte) {
	byte = parseInt(byte);
	if (byte > 0xFF)
		return;
	for (var codepoint in mapping) {
		if (byte == mapping[codepoint])
			return parseInt(codepoint);
	}
}

function isMapping7Bit(mapping) {
	for (var codepoint in mapping) {
		if (mapping[codepoint] > 0x7F)
			return false;
	}
	return true;
}

function isMapping8Bit(mapping) {
	for (var codepoint in mapping) {
		if (mapping[codepoint] > 0xFF)
			return false;
	}
	return true;
}

function initializeMappings(completion) {
	requestAsync('Mappings/mappings.txt', function() {
		totalCount = 0;
		count = 0;
		mappingNames = [];
		mappings = {};
	}, function(line) {
		var parts = line.split('\t');
		++totalCount;
		mappingNames.push(parts[0]);
		loadEncodingFromURL(parts[1], parts[0], function() {
			++count;
			if (count == totalCount) {
				$.each(mappingNames, function(i, value) {
					if (isMapping8Bit(mappings[value])) {
						$('#codepageEncoding')
							.append($('<option' 
								+ (value == 'ISO-8859-1 (Latin-1 Western European)' ? ' selected' : '') 
								+ '></option>')
							.text(value));
					}
				});
				$.each(mappingNames, function(i, value) {
					$('#outputEncoding')
						.append($('<option></option>')
						.text(value));
				});
				completion();
			}
		});
	});
}

function loadEncodingFromURL(url, name, completion) {
	requestAsync(url, function() {
		mapping = {};
	}, function(line) {
		if (line.length == 1 && line.charCodeAt(0) == 26) // weird format found in CP857 (and others)
			return;
		var components = line.split('\t');
		if (components[1].trim() == '')
			return;
		if (isNaN(parseInt(components[0])) || isNaN(parseInt(components[1])))
			throw new Error('Invalid line detected in ' + url + ' (' + i + ')');
		mapping[parseInt(components[1])] = parseInt(components[0]);
	}, function() {
		mappings[name] = mapping;
		completion();
	});
}

function codepointsToEncoding(encoding, codepoints) {
	var codeUnits = [];
	if (encoding == 'Unicode UTF-8') {
		for (var i = 0; i < codepoints.length; ++i) {
			var c = codepoints[i];
			if (c < 0x80) {
				codeUnits.push(c);
			} else if (c < 0x800) {
				codeUnits.push(c >> 6 & 0x1F | 0xC0)
				codeUnits.push(c >> 0 & 0x3F | 0x80)
			} else if (c < 0x10000) {
				codeUnits.push(c >> 12 & 0x0F | 0xE0)
				codeUnits.push(c >>  6 & 0x3F | 0x80)
				codeUnits.push(c >>  0 & 0x3F | 0x80)
			} else if (c < 0x10FFFF) {
				codeUnits.push(c >> 18 & 0x07 | 0xF0)
				codeUnits.push(c >> 12 & 0x3F | 0x80)
				codeUnits.push(c >>  6 & 0x3F | 0x80)
				codeUnits.push(c >>  0 & 0x3F | 0x80)
			} else {
				return parseInt(c); // can never be reached in a compliant browser
			}
		}
	} else if (encoding.includes('UTF-16') || encoding.includes('UCS-2')) {
		var inputStr = ctos(codepoints);
		for (var i = 0; i < inputStr.length; ++i) {
			var x = inputStr.charCodeAt(i);
			if (encoding.includes('UCS-2') && x >= 0xD800 && x <= 0xDFFF) {
				return stoc(String.fromCharCode(x, inputStr.charCodeAt(parseInt(i)+1)))[0];
			}
			if (encoding.includes('16-bit code units')) {
				codeUnits.push(x);
			} else {
				var highByte = x >> 8;
				var lowByte = x & 0xFF;
				if (encoding.includes('LE')) {
					codeUnits.push(lowByte);
					codeUnits.push(highByte);
				} else {
					codeUnits.push(highByte);
					codeUnits.push(lowByte);
				}
			}
		}
	} else if (encoding.includes('UTF-32')) {
		for (var i = 0; i < codepoints.length; ++i) {
			var c = codepoints[i];
			if (encoding.includes('32-bit code units')) {
				codeUnits.push(c);
			} else {
				var bytesBE = [c >> 24, (c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF];
				if (encoding.includes('LE')) {
					codeUnits = codeUnits.concat(bytesBE.reverse());
				} else {
					codeUnits = codeUnits.concat(bytesBE);
				}
			}
		}
	} else if (encoding.includes('Punycode')) {
		var inputStr = ctos(codepoints);
		var punycodeText = punycode.encode(inputStr);
		if (encoding.includes('Text'))
			return punycodeText;
		else
			return stoc(punycodeText);
	} else { // try ASCII or a single-byte encoding from `mappings`
		for (var i = 0; i < codepoints.length; ++i) {
			var c = codepoints[i];
			var mapping = mappings[encoding];
			var bytes = applySingleByteMapping(mapping, c);
			if (bytes) {
				if (bytes.length == 1) {
					codeUnits.push(bytes[0]);
				} else if (bytes.length == 2) {
					codeUnits.push(bytes[0]);
					codeUnits.push(bytes[1]);
				}
			} else {
				return parseInt(c);
			}
		}
	}
	return codeUnits;
}

function bytesToText(format, bytes, hexadecimalPadding) {
	var chars = [];
	for (var i = 0; i < bytes.length; ++i) {
		var b = bytes[i];
		var str = '';
		if (format.includes('Binary')) {
			str = b.toString(2);
			if (format.includes('Padded'))
				str = (Array(hexadecimalPadding * 4 + 1).join('0') + str).substring(str.length);
		} else if (format.includes('Octal')) {
			str = b.toString(8);
		} else if (format.includes('Decimal')) {
			str = b.toString(10);
		} else if (format.includes('Hexadecimal')) {
			str = b.toString(16).toUpperCase();
			if (format.includes('Padded'))
				str = (Array(hexadecimalPadding + 1).join('0') + str).substring(str.length);
		}
		chars.push(str);
	}
	if (format.includes('Prefixed with ')) {
		var prefix = format.substring(format.indexOf('\'') + 1, format.lastIndexOf('\''));
		for (var i = 0; i < chars.length; ++i) {
			chars[i] = prefix + chars[i];
		}
	}
	return chars;
}

function joinBytes(joiner, bytes) {
	switch (joiner) {
		case 'Unseparated':
			return bytes.join('');
		case 'Separated using spaces':
			return bytes.join(' ');
		case 'Separated using commas':
			return bytes.join(',');
		case 'Separated using commas and spaces':
			return bytes.join(', ');
		case 'Separated using semicolons':
			return bytes.join(';');
		case 'Separated using semicolons and spaces':
			return bytes.join('; ');
		case 'Separated using linebreaks':
			return bytes.join('\n');
		case 'Separated using commas and linebreaks':
			return bytes.join(',\n');
	}
}

function hexadecimalPaddingFromEncoding(encoding) {
	if (encoding.includes('16-bit code units'))
		return 4;
	if (encoding.includes('32-bit code units'))
		return 8;
	return 2;
}

function encodeOutput(byteOrderMark, encoding, format, joiner, codepoints) {
	var useBOM = byteOrderMark.startsWith('Use');
	if (useBOM)
		codepoints.unshift(0xFEFF);
	var bytes = codepointsToEncoding(encoding, codepoints);
	if (typeof bytes == 'number') {
		// input contains codepoints incompatible with the selected encoding
		var invalidCodepoint = bytes;
		return '<span style="color: red">Text cannot be encoded in '
		    + encoding
		    + ' because it contains incompatible characters.\nThe first such incompatible character is U+'
		    + itos(invalidCodepoint, 16, 4).toUpperCase()
		    + ' - ' + getHtmlNameDescription(invalidCodepoint) + ' (' + displayCodepoint(invalidCodepoint) + ').</span>';
	} else if (typeof bytes == 'string') {
		var outputString = bytes;
		return escapeHtml(outputString);
	}
	var chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
	return escapeHtml(joinBytes(joiner, chars));
}
