interface Encoding {
	type: string;
	encode?: (codepoints: number[]) => (number[] | number);
	decode?: (codeUnits: number[]) => number[];
	table?: { [codepoint: number]: number };
}

let global_encodings: { [encodingName: string]: Encoding; } = {};

declare let punycode: any;
declare let utf8: any;

function escapeHtml(unsafeString: string): string {
	return unsafeString
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function ctos(codepoints: any): string {
	return punycode.ucs2.encode(codepoints);
}

function stoc(string: string): number[] {
	return punycode.ucs2.decode(string);
}

function nextCodepoint(codepoint: number): number {
	return wasm_bindgen.next_codepoint(codepoint);
}

function previousCodepoint(codepoint: number): number {
	return wasm_bindgen.previous_codepoint(codepoint);
}

function ctou8(codepoints: Uint32Array): Uint8Array | undefined {
	return wasm_bindgen.ctou8(codepoints);
}

function u8toc(bytes: Uint8Array): Uint32Array | undefined {
	return wasm_bindgen.u8toc(bytes);
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

function encodeWithTable(codepoints: number[], table: { [codepoint: number]: number }) {
	let bytes: number[] = [];
	for (let i = 0; i < codepoints.length; ++i) {
		let codepoint = codepoints[i];
		if (typeof codepoint == `string`) {
			codepoint = parseInt(codepoint);
		}
		const number = table[codepoint];
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
}

function decodeWithTable(bytes: number[], table: { [codepoint: number]: number }) {
	const codepointForByteUsingMapping = function(byte: number | string) {
		if (typeof byte == `string`) {
			byte = parseInt(byte);
		}
		for (let codepoint in table) {
			if (byte == table[codepoint])
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
}

function parseTableFromLines(lines: string[], name: string) {
	let table: { [codepoint: number]: number } = [];
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
		table[parseInt(components[1])] = parseInt(components[0]);
	}
	return table;
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
		encoding.table = parseTableFromLines(lines, name);
		encoding.encode = function(codepoints) {
			return encodeWithTable(codepoints, encoding.table!);
		};
		encoding.decode = function(bytes) {
			return decodeWithTable(bytes, encoding.table!);
		};
	}
	global_encodings[name] = encoding;
}

function codepointsToEncoding(encoding: string, codepoints: number[]) {
	return global_encodings[encoding].encode!(codepoints);
}

function codeUnitsToCodepoints(encoding: string, codeUnits: number[]): number[] | undefined {
	return global_encodings[encoding].decode!(codeUnits);
}

function bytesToText(format: string, bytes: number[], minLength?: number) {
	const chars: string[] = [];
	if (typeof minLength === `undefined`)
		minLength = 0;
	for (let i = 0; i < bytes.length; ++i) {
		const b = bytes[i];
		let str = numberToStringWithFormat(b, format);
		while (str.length < minLength)
			str = `0` + str;
		str = ((document.getElementById('codeUnitPrefix')! as any).value || ``) + str;
		str = str + ((document.getElementById('codeUnitSuffix')! as any).value || ``);
		chars.push(str);
	}
	return chars;
}

function textToBytes(format: string, strings: string[]) {
	const bytes: number[] = [];
	for (let i = 0; i < strings.length; ++i) {
		const str = strings[i];
		bytes.push(parseIntWithFormat(str, format));
	}
	return bytes;
}
