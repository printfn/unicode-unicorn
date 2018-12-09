declare let punycode: any;
declare let utf8: any;

interface Encoding {
	type: string;
	encode?: (codepoints: number[]) => (number[] | number);
	decode?: (codeUnits: number[]) => number[];
	table?: { [codepoint: number]: number };
}

let global_encodings: { [encodingName: string]: Encoding; } = {};

function escapeHtml(string: string): string {
	return he.encode(string);
}

function displayCodepoint(codepoint?: number): string {
	if (typeof codepoint == `undefined`)
		return ``;
	if (codepoint < 0x20)
		codepoint += 0x2400;
	if (codepoint == 0x7F)
		codepoint = 0x2421;
	let codepoints = [codepoint];
	if (graphemeBreakValueForCodepoint(codepoint) == `Extend`)
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
	const u8str = utf8.encode(ctos(codepoints));
	const res: number[] = [];
	for (let i = 0; i < u8str.length; ++i)
		res.push(u8str.charCodeAt(i));
	return res;
}

function u8toc(bytes: number[]): number[] {
	let u8str = ``;
	for (let i = 0; i < bytes.length; ++i)
		u8str += String.fromCharCode(bytes[i]);
	return stoc(utf8.decode(u8str));
}

function itos(int: number, base: number, padding: number = 0) {
	let res = int.toString(base).toUpperCase();
	while (res.length < padding) {
		res = `0` + res;
	}
	return res;
}

function initializeMappings(completion: () => void) {
	for (let i in global_encodingData) {
		let encodingData = global_encodingData[i];
		loadEncodingFromData(encodingData.type, encodingData.name, encodingData.data);
	}
	let codepageOptionStrings = ``;
	let outputEncodingOptionStrings = ``;
	let mojibakeOptionStrings = ``;
	$.each(global_encodingNames, function(i, encodingName) {
		if (global_encodings[encodingName].type == `7-bit mapping` ||
			global_encodings[encodingName].type == `8-bit mapping`) {
			codepageOptionStrings += `<option${
				encodingName == `ISO-8859-1 (Latin-1 Western European)` ? ` selected` : ``
			}>${encodingName}</option>`;
		}
		outputEncodingOptionStrings += `<option>${encodingName}</option>`;
		mojibakeOptionStrings += `<option>${encodingName}</option>`;
	});
	updateSelectOptions(`#codepageEncoding`, codepageOptionStrings);
	updateSelectOptions(`#outputEncoding`, outputEncodingOptionStrings);
	updateSelectOptions(`#mojibakeEncodings`, mojibakeOptionStrings);
	completion();
}

function loadEncodingFromData(type: string, name: string, data: string) {
	let encoding: Encoding = {
		type: type,
		encode: undefined,
		decode: undefined
	};
	let lines = data.split('\n');
	if (type.includes(`function`)) {
		encoding = eval(lines.join(`\n`));
		encoding.type = type;
	} else {
		encoding.encode = function(codepoints) {
			let bytes: number[] = [];
			for (let i = 0; i < codepoints.length; ++i) {
				let codepoint = codepoints[i];
				if (typeof codepoint == `string`) {
					codepoint = parseInt(codepoint);
				}
				const number = encoding.table![codepoint];
				if (typeof number == `undefined`) {
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
			const table = encoding.table;
			const codepointForByteUsingMapping = function(byte: number | string) {
				if (typeof byte == `string`) {
					byte = parseInt(byte);
				}
				for (let codepoint in table!) {
					if (byte == table![codepoint])
						return parseInt(codepoint);
				}
			};
			const codepoints: number[] = [];
			for (let i = 0; i < bytes.length; ++i) {
				let cp = codepointForByteUsingMapping(bytes[i]);
				if (typeof cp != `undefined`) {
					codepoints.push(cp);
					continue;
				}
				cp = codepointForByteUsingMapping((bytes[i] << 8) + bytes[i+1]);
				if (typeof cp == `undefined`) {
					return [];
				}
				codepoints.push(cp);
				++i;
			}
			return codepoints;
		};
	}
	if (type.includes(`mapping`)) {
		for (let i = 0; i < lines.length; ++i) {
			let line = lines[i];
			if (line.length === 0 || line[0] == `#`) {
				continue;
			}
			if (line.indexOf(`#`) != -1) {
				line = line.substring(0, line.indexOf(`#`));
			}
			if (line.length == 1 && line.charCodeAt(0) == 26) // weird format found in CP857 (and others)
				continue;
			const components = line.split(`\t`);
			if (components[1].trim() === ``)
				continue;
			if (isNaN(parseInt(components[0])) || isNaN(parseInt(components[1])))
				throw new Error(`Invalid line detected in encoding ${name}`);
			if (!encoding.table)
				encoding.table = [];
			encoding.table[parseInt(components[1])] = parseInt(components[0]);
		}
	}
	global_encodings[name] = encoding;
}

function codepointsToEncoding(encoding: string, codepoints: number[]) {
	return global_encodings[encoding].encode!(codepoints);
}

function codeUnitsToCodepoints(encoding: string, codeUnits: number[]): number[] | undefined {
	return global_encodings[encoding].decode!(codeUnits);
}

function bytesToText(format: string, bytes: number[], hexadecimalPadding: number) {
	const chars: string[] = [];
	for (let i = 0; i < bytes.length; ++i) {
		const b = bytes[i];
		let str = ``;
		if (format.includes(`Binary`)) {
			str = b.toString(2);
			if (format.includes(`Padded`)) {
				str = (Array(hexadecimalPadding * 4 + 1).join(`0`) + str).substring(str.length);
			}
		} else if (format.includes(`Octal`)) {
			str = b.toString(8);
		} else if (format.includes(`Decimal`)) {
			str = b.toString(10);
		} else if (format.includes(`Hexadecimal`)) {
			str = b.toString(16).toUpperCase();
			if (format.includes(`Padded`)) {
				str = (Array(hexadecimalPadding + 1).join(`0`) + str).substring(str.length);
			}
		}
		chars.push(str);
	}
	if (format.includes(`Prefixed with `)) {
		const prefix = format.substring(format.indexOf(`'`) + 1, format.lastIndexOf(`'`));
		for (let i = 0; i < chars.length; ++i) {
			chars[i] = prefix + chars[i];
		}
	}
	return chars;
}

function textToBytes(format: string, strings: string[]) {
	if (format.includes(`Prefixed with `)) {
		const prefix = format.substring(format.indexOf(`'`) + 1, format.lastIndexOf(`'`));
		for (let i = 0; i < strings.length; ++i) {
			strings[i] = strings[i].substring(prefix.length);
		}
	}
	const bytes: number[] = [];
	for (let i = 0; i < strings.length; ++i) {
		const str = strings[i];
		if (format.includes(`Binary`)) {
			bytes.push(parseInt(str, 2));
		} else if (format.includes(`Octal`)) {
			bytes.push(parseInt(str, 8));
		} else if (format.includes(`Decimal`)) {
			bytes.push(parseInt(str, 10));
		} else if (format.includes(`Hexadecimal`)) {
			bytes.push(parseInt(str, 16));
		}
	}
	return bytes;
}

function stringForJoiner(joiner: string) {
	switch (joiner) {
		case `Unseparated`:
			return ``;
		case `Separated using spaces`:
			return ` `;
		case `Separated using commas`:
			return `,`;
		case `Separated using commas and spaces`:
			return `, `;
		case `Separated using semicolons`:
			return `;`;
		case `Separated using semicolons and spaces`:
			return `; `;
		case `Separated using linebreaks`:
			return `\n`;
		case `Separated using commas and linebreaks`:
			return `,\n`;
		default:
			return ` `;
	}
}

function joinBytes(joiner: string, bytes: any[]) {
	return bytes.join(stringForJoiner(joiner));
}

function splitBytes(joiner: string, str: string) {
	return str.split(stringForJoiner(joiner));
}

function hexadecimalPaddingFromEncoding(encoding: string) {
	if (encoding.includes(`16-bit code units`))
		return 4;
	if (encoding.includes(`32-bit code units`))
		return 8;
	return 2;
}

function encodeOutput(byteOrderMark: string, encoding: string, format: string, joiner: string, codepoints: number[]) {
	const useBOM = byteOrderMark.startsWith(`Use`);
	if (useBOM) {
		codepoints.unshift(0xFEFF);
	}
	const bytes = codepointsToEncoding(encoding, codepoints);
	if (typeof bytes == `number`) {
		// input contains codepoints incompatible with the selected encoding
		const invalidCodepoint = bytes;
		return `<span style="color: red">Text cannot be encoded in ${encoding
		} because it contains incompatible characters.\nThe first such incompatible character is U+${
			itos(invalidCodepoint, 16, 4)
		} - ${getHtmlNameDescription(invalidCodepoint)} (${
			displayCodepoint(invalidCodepoint)}).</span>`;
	} else if (typeof bytes == `string`) {
		const outputString = bytes;
		return escapeHtml(outputString);
	}
	const chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
	return escapeHtml(joinBytes(joiner, chars));
}

function decodeOutput(byteOrderMark: string, encoding: string, format: string, joiner: string, str: string) {
	if (str === ``)
		return;
	if (encoding.includes(`Punycode`) && encoding.includes(`Text`)) {
		return stoc(punycode.decode(str));
	}
	if (encoding.includes(`HTML Entities`)) {
		return stoc(he.decode(ctos(str)));
	}
	const strings = splitBytes(joiner, str);
	const codeUnits = textToBytes(format, strings);
	for (let i = 0; i < codeUnits.length; ++i)
		if (isNaN(codeUnits[i]))
			return;
	const codepoints = codeUnitsToCodepoints(encoding, codeUnits);
	if (!codepoints) return;
	const useBOM = byteOrderMark.startsWith(`Use`);
	if (useBOM) {
		codepoints.unshift(1);
	}
	return codepoints;
}
