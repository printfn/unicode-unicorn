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

function codepointsToEncoding(encoding, codepoints) {
	var codeUnits = [];
	if (encoding == 'Unicode UTF-8') {
		for (var i in codepoints) {
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
				return [];
			}
		}
	} else if (encoding.includes('UTF-16')) {
		var inputStr = ctos(codepoints);
		for (var i in inputStr) {
			var x = inputStr.charCodeAt(i);
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
		for (var i in codepoints) {
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
	for (var i in bytes) {
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
		for (var i in chars) {
			chars[i] = prefix + chars[i];
		}
	}
	return chars;
}

function joinBytes(joiner, bytes) {
	switch (joiner) {
		case 'Unseparated':
			return bytes.join('');
		case 'Space-separated':
			return bytes.join(' ');
		case 'Comma-separated':
			return bytes.join(', ');
		case 'Linebreak-separated':
			return bytes.join('<br>');
	}
}

function hexadecimalPaddingFromEncoding(encoding) {
	if (encoding == 'Unicode UTF-8')
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
	var chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
	return joinBytes(joiner, chars);
}
