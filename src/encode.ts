declare var punycode: any;
declare var utf8: any;

interface Encoding {
	type: string;
	encode: (codepoints: number[]) => number[] | number;
	decode: (codeUnits: number[]) => number[];
	table?: { [codepoint: number]: number };
}

var global_encodingNames: string[] = [];
var global_encodings: { [encodingName: string]: Encoding; } = {};

function escapeHtml(string: string): string {
	return he.encode(string);
}

function displayCodepoint(codepoint?: number): string {
	if (typeof codepoint == 'undefined')
		return;
	if (codepoint < 0x20)
		codepoint += 0x2400;
	if (codepoint == 0x7F)
		codepoint = 0x2421;
	var codepoints = [codepoint];
	if (graphemeBreakValueForCodepoint(codepoint) == 'Extend')
		codepoints = [0x25CC, codepoint];
	return escapeHtml(ctos(codepoints));
}

function ctos(codepoints: any): string {
	return punycode.ucs2.encode(codepoints);
}

function stoc(string: string): number[] {
	return punycode.ucs2.decode(string);
}

function ctou8(codepoints: number[]): number[] {
	var u8str = utf8.encode(ctos(codepoints));
	var res: number[] = [];
	for (var i = 0; i < u8str.length; ++i)
		res.push(u8str.charCodeAt(i));
	return res;
}

function u8toc(bytes: number[]): number[] {
	var u8str = '';
	for (var i = 0; i < bytes.length; ++i)
		u8str += String.fromCharCode(bytes[i]);
	return stoc(utf8.decode(u8str));
}

function itos(int: number, base: number, padding: number = 0) {
	var res = int.toString(base).toUpperCase();
	while (res.length < padding) {
		res = '0' + res;
	}
	return res;
}

var totalCount = 0;
var count = 0;
function initializeMappings(completion: () => void) {
	requestAsync('data/encodings.txt', function() {
		totalCount = 0;
		count = 0;
	}, function(line) {
		var parts = line.split('\t');
		++totalCount;
		var type = parts[0];
		var name = parts[1];
		var url = parts[2];
		global_encodingNames.push(name);
		window.setTimeout(function() {
			loadEncodingFromURL(type, name, url, function() {
				++count;
				if (count == totalCount) {
					let codepageOptionStrings = '';
					let outputEncodingOptionStrings = '';
					let mojibakeOptionStrings = '';
					$.each(global_encodingNames, function(i, encodingName) {
						if (global_encodings[encodingName].type == '7-bit mapping' ||
							global_encodings[encodingName].type == '8-bit mapping') {
							codepageOptionStrings += '<option' +
								(encodingName == 'ISO-8859-1 (Latin-1 Western European)' ? ' selected' : '') +
								'>' +
								encodingName +
								'</option>';
						}
						outputEncodingOptionStrings += '<option>' + encodingName + '</option>';
						mojibakeOptionStrings += '<option' +
								//(encodingName == 'Unicode UTF-8' || encodingName.startsWith('Code page 1252') ? ' selected' : '') +
								'>' + 
								encodingName +
								'</option>';
					});
					updateSelectOptions('codepageEncoding', codepageOptionStrings);
					updateSelectOptions('outputEncoding', outputEncodingOptionStrings);
					updateSelectOptions('mojibakeEncodings', mojibakeOptionStrings);
					completion();
				}
			});
		}, 0);
	});
}

function loadEncodingFromURL(type: string, name: string, url: string, completion: () => void) {
	var encoding: Encoding = {
		type: type,
		encode: null,
		decode: null
	};
	requestAsync(url, function(lines) {
		if (type.includes('function')) {
			encoding = eval(lines.join('\n'));
			encoding.type = type;
		} else {
			encoding.encode = function(codepoints) {
				var bytes: number[] = [];
				for (let i = 0; i < codepoints.length; ++i) {
					var codepoint = codepoints[i];
					if (typeof codepoint == 'string') {
						codepoint = parseInt(codepoint);
					}
					var number = encoding.table[codepoint];
					if (typeof number == 'undefined') {
						// if (codepoint <= 0xFF)
						// 	bytes.push(codepoint);
						// else
						return codepoint;
					}
					if (number <= 0xFF) {
						bytes.push(number);
					} else {
						bytes.push(number >> 8);
						bytes.push(number & 0xFF);
					}
				}
				return bytes;
			};
			encoding.decode = function(bytes) {
				var table = encoding.table;
				var codepointForByteUsingMapping = function(byte: number | string) {
					if (typeof byte == 'string') {
						byte = parseInt(byte);
					}
					for (var codepoint in table) {
						if (byte == table[codepoint])
							return parseInt(codepoint);
					}
				};
				var codepoints: number[] = [];
				for (var i = 0; i < bytes.length; ++i) {
					var cp = codepointForByteUsingMapping(bytes[i]);
					if (typeof cp != 'undefined') {
						codepoints.push(cp);
						continue;
					}
					cp = codepointForByteUsingMapping((bytes[i] << 8) + bytes[i+1]);
					if (typeof cp == 'undefined') {
						return;
					}
					codepoints.push(cp);
					++i;
				}
				return codepoints;
			};
		}
	}, function(line) {
		if (type.includes('mapping')) {
			if (line.length == 1 && line.charCodeAt(0) == 26) // weird format found in CP857 (and others)
				return;
			var components = line.split('\t');
			if (components[1].trim() === '')
				return;
			if (isNaN(parseInt(components[0])) || isNaN(parseInt(components[1])))
				throw new Error('Invalid line detected in ' + url);
			if (!encoding.table)
				encoding.table = [];
			encoding.table[parseInt(components[1])] = parseInt(components[0]);
		}
	}, function() {
		global_encodings[name] = encoding;
		completion();
	});
}

function codepointsToEncoding(encoding: string, codepoints: number[]) {
	return global_encodings[encoding].encode(codepoints);
}

function codeUnitsToCodepoints(encoding: string, codeUnits: number[]) {
	return global_encodings[encoding].decode(codeUnits);
}

function bytesToText(format: string, bytes: number[], hexadecimalPadding: number) {
	var chars: string[] = [];
	for (let i = 0; i < bytes.length; ++i) {
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
		for (let i = 0; i < chars.length; ++i) {
			chars[i] = prefix + chars[i];
		}
	}
	return chars;
}

function textToBytes(format: string, strings: string[]) {
	if (format.includes('Prefixed with ')) {
		var prefix = format.substring(format.indexOf('\'') + 1, format.lastIndexOf('\''));
		for (let i = 0; i < strings.length; ++i) {
			strings[i] = strings[i].substring(prefix.length);
		}
	}
	var bytes: number[] = [];
	for (let i = 0; i < strings.length; ++i) {
		var str = strings[i];
		if (format.includes('Binary')) {
			bytes.push(parseInt(str, 2));
		} else if (format.includes('Octal')) {
			bytes.push(parseInt(str, 8));
		} else if (format.includes('Decimal')) {
			bytes.push(parseInt(str, 10));
		} else if (format.includes('Hexadecimal')) {
			bytes.push(parseInt(str, 16));
		}
	}
	return bytes;
}

function stringForJoiner(joiner: string) {
	switch (joiner) {
		case 'Unseparated':
			return '';
		case 'Separated using spaces':
			return ' ';
		case 'Separated using commas':
			return ',';
		case 'Separated using commas and spaces':
			return ', ';
		case 'Separated using semicolons':
			return ';';
		case 'Separated using semicolons and spaces':
			return '; ';
		case 'Separated using linebreaks':
			return '\n';
		case 'Separated using commas and linebreaks':
			return ',\n';
	}
}

function joinBytes(joiner: string, bytes: any[]) {
	return bytes.join(stringForJoiner(joiner));
}

function splitBytes(joiner: string, str: string) {
	return str.split(stringForJoiner(joiner));
}

function hexadecimalPaddingFromEncoding(encoding: string) {
	if (encoding.includes('16-bit code units'))
		return 4;
	if (encoding.includes('32-bit code units'))
		return 8;
	return 2;
}

function encodeOutput(byteOrderMark: string, encoding: string, format: string, joiner: string, codepoints: number[]) {
	var useBOM = byteOrderMark.startsWith('Use');
	if (useBOM)
		codepoints.unshift(0xFEFF);
	var bytes = codepointsToEncoding(encoding, codepoints);
	if (typeof bytes == 'number') {
		// input contains codepoints incompatible with the selected encoding
		var invalidCodepoint = bytes;
		return '<span style="color: red">Text cannot be encoded in ' + encoding +
			' because it contains incompatible characters.\nThe first such incompatible character is U+' +
			itos(invalidCodepoint, 16, 4) +
			' - ' + getHtmlNameDescription(invalidCodepoint) +
			' (' + displayCodepoint(invalidCodepoint) + ').</span>';
	} else if (typeof bytes == 'string') {
		var outputString = bytes;
		return escapeHtml(outputString);
	}
	var chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
	return escapeHtml(joinBytes(joiner, chars));
}

function decodeOutput(byteOrderMark: string, encoding: string, format: string, joiner: string, str: string) {
	if (str === '')
		return;
	if (encoding.includes('Punycode') && encoding.includes('Text')) {
		return stoc(punycode.decode(str));
	}
	if (encoding.includes('HTML Entities')) {
		return stoc(he.decode(ctos(str)));
	}
	var strings = splitBytes(joiner, str);
	var codeUnits = textToBytes(format, strings);
	for (var i = 0; i < codeUnits.length; ++i)
		if (isNaN(codeUnits[i]))
			return;
	var codepoints = codeUnitsToCodepoints(encoding, codeUnits);
	var useBOM = byteOrderMark.startsWith('Use');
	if (useBOM)
		codepoints.unshift(1);
	return codepoints;
}
