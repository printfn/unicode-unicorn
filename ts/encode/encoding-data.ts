interface Encoding {
    type: string;
    encode?: (codepoints: number[]) => number[] | number;
    decode?: (codeUnits: number[]) => number[];
}

let global_encodings: { [encodingName: string]: Encoding } = {};

declare let punycode: any;
declare let utf8: any;

function escapeHtml(unsafeString: string): string {
    return unsafeString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function ctos(codepoints: number[]): string {
    return wasm_bindgen.ctos(codepoints);
}

function stoc(string: string): number[] {
    return Array.from(wasm_bindgen.stoc(string));
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
        res = '0' + res;
    }
    return res;
}

async function initializeMappings() {
    for (let i in global_encodingData) {
        let encodingData = global_encodingData[i];
        loadEncodingFromData(encodingData.type, encodingData.name);
    }
    let codepageOptionStrings = '';
    let outputEncodingOptionStrings = '';
    let mojibakeOptionStrings = '';
    $.each(global_encodingNames, function(i, encodingName) {
        if (
            global_encodings[encodingName].type == '7-bit wasm' ||
            global_encodings[encodingName].type == '8-bit wasm'
        ) {
            codepageOptionStrings += `<option${
                encodingName == 'ISO-8859-1 (Latin-1 Western European)' ? ' selected' : ''
            }>${encodingName}</option>`;
        }
        outputEncodingOptionStrings += `<option>${encodingName}</option>`;
        mojibakeOptionStrings += `<option>${encodingName}</option>`;
    });
    updateSelectOptions('codepageEncoding', codepageOptionStrings);
    updateSelectOptions('outputEncoding', outputEncodingOptionStrings);
    updateSelectOptions('mojibakeEncodings', mojibakeOptionStrings);
}

function loadEncodingFromData(type: string, name: string) {
    let encoding: Encoding = {
        type: type,
        encode: undefined,
        decode: undefined
    };
    if (type == '7-bit wasm' || type == '8-bit wasm' || type == 'other wasm') {
        encoding.encode = function(codepoints) {
            let res = JSON.parse(wasm_bindgen.encode_str(name, codepoints));
            if (res.success) {
                return res.encoded_code_units;
            } else {
                return res.first_invalid_codepoint;
            }
        };
        encoding.decode = function(bytes) {
            return wasm_bindgen.decode_str(name, bytes) || [];
        };
    } else {
        throw `Unknown encoding type: ${type}`;
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
    if (typeof minLength === 'undefined') minLength = 0;
    for (let i = 0; i < bytes.length; ++i) {
        const b = bytes[i];
        let str = numberToStringWithFormat(b, format);
        while (str.length < minLength) str = '0' + str;
        str = ((document.getElementById('codeUnitPrefix')! as any).value || '') + str;
        str = str + ((document.getElementById('codeUnitSuffix')! as any).value || '');
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
