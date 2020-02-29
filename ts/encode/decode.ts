function validDigitsForFormat(format: string) {
    let validDigitChars: string[] = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
    ];
    validDigitChars = validDigitChars.slice(0, numberForFormat(format));
    if (format == 'Hexadecimal (uppercase)')
        validDigitChars = validDigitChars.map(s => s.toUpperCase());
    return validDigitChars;
}

function splitByFormatDigits(str: string, format: string) {
    let validDigitChars = validDigitsForFormat(format);
    let strings: string[] = [];
    let currentStr = '';
    for (let i = 0; i < str.length; ++i) {
        if (validDigitChars.indexOf(str[i]) != -1) {
            currentStr += str[i];
        } else {
            if (currentStr != '') {
                strings.push(currentStr);
                currentStr = '';
            }
        }
    }
    if (currentStr != '') {
        strings.push(currentStr);
        currentStr = '';
    }
    return strings;
}

function decodeOutput(
    byteOrderMark: string,
    encoding: string,
    format: string,
    str: string
) {
    if (!str) return;
    let strings = splitByFormatDigits(str, format);
    const codeUnits = textToBytes(format, strings);
    for (let i = 0; i < codeUnits.length; ++i) if (isNaN(codeUnits[i])) return;
    const codepoints = codeUnitsToCodepoints(encoding, codeUnits);
    if (!codepoints) return;
    const useBOM = byteOrderMark.startsWith('Use');
    if (useBOM) {
        codepoints.unshift(1);
    }
    return codepoints;
}
