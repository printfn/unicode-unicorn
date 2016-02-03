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
	for (var i in codepoints) {
		var c = codepoints[i];
		if (encoding == 'Unicode UTF-8') {
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
	}
	return codeUnits;
}

function bytesToText(format, bytes) {
	var chars = [];
	for (var i in bytes) {
		var b = bytes[i];
		if (format == 'Decimal') {
			chars.push(b);
		}
	}
	return chars;
}

function joinBytes(joiner, bytes) {
	switch (joiner) {
		case 'Space-separated':
			return bytes.join(' ');
		case 'Comma-separated':
			return bytes.join(', ');
		case 'Linebreak-separated':
			return bytes.join('<br>');
	}
}

function encodeOutput(encoding, format, joiner, codepoints) {
	var bytes = codepointsToEncoding(encoding, codepoints);
	var chars = bytesToText(format, bytes);
	return joinBytes(joiner, chars);
}













