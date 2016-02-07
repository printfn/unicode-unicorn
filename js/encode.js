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

function renderedCodepoint(codepoint) {
	if (codepoint < 0x20)
		return codepoint + 0x2400;
	if (codepoint == 0x7F)
		return 0x2421;
	return codepoint;
}

// encoding functions from https://github.com/bestiejs/punycode.js/blob/master/punycode.js
function ctos(array) {
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}
	return map(array, function(value) {
		var output = '';
		if (value > 0xFFFF) {
			value -= 0x10000;
			output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
			value = 0xDC00 | value & 0x3FF;
		}
		output += String.fromCharCode(value);
		return output;
	}).join('');
}

function stoc(string) {
	var output = [],
	    counter = 0,
	    length = string.length,
	    value,
	    extra;
	while (counter < length) {
		value = string.charCodeAt(counter++);
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			// high surrogate, and there is a next character
			extra = string.charCodeAt(counter++);
			if ((extra & 0xFC00) == 0xDC00) { // low surrogate
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
			} else {
				// unmatched surrogate; only append this code unit, in case the next
				// code unit is the high surrogate of a surrogate pair
				output.push(value);
				counter--;
			}
		} else {
			output.push(value);
		}
	}
	return output;
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
	if (mapping[codepoint])
		return mapping[codepoint];
	if (codepoint > 0xFF)
		return; // Non-ISO-8859-1 codepoints not included in `mapping` can't be encoded
	for (var x in mapping) {
		// x is a codepoint
		if (mapping[x] == codepoint)
			return; // another codepoint as assigned to the 8-bit version of `codepoint`
	}
	return codepoint;
}

function codepointForByteUsingMapping(mapping, byte) {
	byte = parseInt(byte);
	if (byte > 0xFF)
		return;
	for (var codepoint in mapping) {
		if (byte == mapping[codepoint])
			return codepoint;
	}
	return byte;
}

function getSingleByteMappingForEncoding(encoding) {
	if (encoding == 'ISO-8859-1 ("Latin-1")') {
		return {};
	} else if (encoding == 'ISO-8859-15 ("Latin-9")') {
		return {
			8364: 0xA4,
			352: 0xA6,
			353: 0xA8,
			381: 0xB4,
			382: 0xB8,
			338: 0xBC,
			339: 0xBD,
			376: 0xBE
		};
	} else if (encoding == 'Windows-1252') {
		return {
			0x20AC: 128,
			0x201A: 130,
			0x0192: 131,
			0x201E: 132,
			0x2026: 133,
			0x2020: 134,
			0x2021: 135,
			0x02C6: 136,
			0x2030: 137,
			0x0160: 138,
			0x2039: 139,
			0x0152: 140,
			0x017D: 142,
			0x2018: 145,
			0x2019: 146,
			0x201C: 147,
			0x201D: 148,
			0x2022: 149,
			0x2013: 150,
			0x2014: 151,
			0x02DC: 152,
			0x2122: 153,
			0x0161: 154,
			0x203A: 155,
			0x0153: 156,
			0x017E: 158,
			0x0178: 159
		}
	}
}

function codepointsToEncoding(encoding, codepoints) {
	var codeUnits = [];
	if (encoding == 'ASCII' || encoding.startsWith('ISO-8859-') || encoding.startsWith('Windows-')) {
		for (var i = 0; i < codepoints.length; ++i) {
			var c = codepoints[i];
			if (encoding == 'ASCII') {
				if (c < 0x80) {
					codeUnits.push(c);
				} else {
					return parseInt(c);
				}
			} else {
				var mapping = getSingleByteMappingForEncoding(encoding);
				var codeUnit = applySingleByteMapping(mapping, c);
				if (codeUnit) {
					codeUnits.push(codeUnit);
				} else {
					return parseInt(c);
				}
			}
		}
	} else if (encoding == 'Unicode UTF-8') {
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
	if (encoding == 'Unicode UTF-8' || encoding == 'ASCII' || encoding.startsWith('ISO-8859'))
		return 2;
	if (encoding.startsWith('Windows-'))
		return 2;
	if (encoding.includes('8-bit code units'))
		return 2;
	if (encoding.includes('16-bit code units'))
		return 4;
	if (encoding.includes('32-bit code units'))
		return 8;
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
		    + ' - ' + getHtmlNameDescription(invalidCodepoint) + '.</span>';
	}
	var chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
	return escapeHtml(joinBytes(joiner, chars));
}
