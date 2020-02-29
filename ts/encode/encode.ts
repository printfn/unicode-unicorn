function encodeOutput(
    byteOrderMark: string,
    encoding: string,
    format: string,
    codepoints: number[]
) {
    const useBOM = byteOrderMark.startsWith('Use');
    if (useBOM) {
        codepoints.unshift(0xfeff);
    }
    let bytes;
    try {
        bytes = codepointsToEncoding(encoding, codepoints);
    } catch {
        bytes = undefined;
    }
    // TODO: bytes should never be undefined if encodings (specifically utf-8/16) are written properly
    if (typeof bytes == 'number' || !bytes) {
        // input contains codepoints incompatible with the selected encoding
        const invalidCodepoint = bytes || 0;
        return `<span style="color: red">Text cannot be encoded in ${encoding} because it contains incompatible characters.\nThe first such incompatible character is U+${itos(
            invalidCodepoint,
            16,
            4
        )} - ${getHtmlNameDescription(invalidCodepoint)} (${displayCodepoint(
            invalidCodepoint
        )}).</span>`;
    } else if (typeof bytes == 'string') {
        const outputString = bytes;
        return escapeHtml(outputString);
    }
    let minLength = parseInt((document.getElementById('minCodeUnitLength')! as any).value, 10);
    if (minLength == 0) {
        let bytesPerCodeUnit = 1;
        // set minLength automatically based on code unit size and base (hex, binary, etc.)
        if (encoding.includes('32-bit code units')) {
            bytesPerCodeUnit = 4;
        } else if (encoding.includes('16-bit code units')) {
            bytesPerCodeUnit = 2;
        }
        if (format == 'Binary') {
            minLength = bytesPerCodeUnit * 8; // 8, 16, or 32
        } else if (format == 'Octal') {
            minLength = bytesPerCodeUnit * 3; // 3, 6, or 12
        } else if (format == 'Decimal') {
            minLength = 0;
        } else if (format == 'Hexadecimal (uppercase)' || format == 'Hexadecimal (lowercase)') {
            minLength = bytesPerCodeUnit * 2; // 2, 4 or 8
        }
    }
    const chars = bytesToText(format, bytes, minLength);
    let grouping = parseInt((document.getElementById('groupingCount')! as any).value, 10);
    if (grouping == 0) grouping = 1;
    let groups: string[] = [];
    for (let i = 0; i < chars.length; ++i) {
        if (i % grouping == 0) {
            groups.push(chars[i]);
        } else {
            groups[groups.length - 1] += chars[i];
        }
    }
    const groupPrefix = (document.getElementById('groupPrefix')! as any).value || '';
    const groupSuffix = (document.getElementById('groupSuffix')! as any).value || '';
    for (let i = 0; i < groups.length; ++i) {
        groups[i] = groupPrefix + groups[i] + groupSuffix;
    }
    const groupSeparator = (document.getElementById('outputJoinerText')! as any).value || '';
    return escapeHtml(groups.join(groupSeparator));
}
