function decodeOutput(byteOrderMark: string, encoding: string, format: string, str: string) {
	if (str === ``)
		return;
	let validDigitChars: string[] = [];
	if (format == `Binary`) {
		validDigitChars = [`0`, `1`];
	} else if (format == `Octal`) {
		validDigitChars = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`];
	} else if (format == `Decimal`) {
		validDigitChars = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`];
	} else if (format == `Hexadecimal (uppercase)`) {
		validDigitChars = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `A`, `B`, `C`, `D`, `E`, `F`];
	} else if (format == `Hexadecimal (lowercase)`) {
		validDigitChars = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `a`, `b`, `c`, `d`, `e`, `f`];
	}
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
