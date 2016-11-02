var global_encodingNames = [];
var global_encodings = {};
function escapeHtml(string) {
    return he.encode(string);
}
function displayCodepoint(codepoint) {
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
function ctos(codepoints) {
    return punycode.ucs2.encode(codepoints);
}
function stoc(string) {
    return punycode.ucs2.decode(string);
}
function ctou8(codepoints) {
    var u8str = utf8.encode(ctos(codepoints));
    var res = [];
    for (var i = 0; i < u8str.length; ++i)
        res.push(u8str.charCodeAt(i));
    return res;
}
function u8toc(bytes) {
    var u8str = '';
    for (var i = 0; i < bytes.length; ++i)
        u8str += String.fromCharCode(bytes[i]);
    return stoc(utf8.decode(u8str));
}
function itos(int, base, padding) {
    if (padding === void 0) { padding = 0; }
    var res = int.toString(base).toUpperCase();
    while (res.length < padding) {
        res = '0' + res;
    }
    return res;
}
var totalCount = 0;
var count = 0;
function initializeMappings(completion) {
    requestAsync('data/encodings.txt', function () {
        totalCount = 0;
        count = 0;
    }, function (line) {
        var parts = line.split('\t');
        ++totalCount;
        var type = parts[0];
        var name = parts[1];
        var url = parts[2];
        global_encodingNames.push(name);
        window.setTimeout(function () {
            loadEncodingFromURL(type, name, url, function () {
                ++count;
                if (count == totalCount) {
                    $.each(global_encodingNames, function (i, encodingName) {
                        if (global_encodings[encodingName].type == '7-bit mapping' ||
                            global_encodings[encodingName].type == '8-bit mapping') {
                            $('#codepageEncoding')
                                .append($('<option' +
                                (encodingName == 'ISO-8859-1 (Latin-1 Western European)' ? ' selected' : '') +
                                '></option>')
                                .text(encodingName));
                        }
                        $('#outputEncoding')
                            .append($('<option></option>')
                            .text(encodingName));
                    });
                    completion();
                }
            });
        }, 0);
    });
}
function loadEncodingFromURL(type, name, url, completion) {
    var encoding = {
        type: type,
        encode: null,
        decode: null
    };
    requestAsync(url, function (lines) {
        if (type.includes('function')) {
            encoding = eval(lines.join('\n'));
        }
        else {
            encoding.encode = function (codepoints) {
                var bytes = [];
                for (var i = 0; i < codepoints.length; ++i) {
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
                    }
                    else {
                        bytes.push(number >> 8);
                        bytes.push(number & 0xFF);
                    }
                }
                return bytes;
            };
            encoding.decode = function (bytes) {
                var table = encoding.table;
                var codepointForByteUsingMapping = function (byte) {
                    if (typeof byte == 'string') {
                        byte = parseInt(byte);
                    }
                    for (var codepoint in table) {
                        if (byte == table[codepoint])
                            return parseInt(codepoint);
                    }
                };
                var codepoints = [];
                for (var i = 0; i < bytes.length; ++i) {
                    var cp = codepointForByteUsingMapping(bytes[i]);
                    if (typeof cp != 'undefined') {
                        codepoints.push(cp);
                        continue;
                    }
                    cp = codepointForByteUsingMapping((bytes[i] << 8) + bytes[i + 1]);
                    if (typeof cp == 'undefined') {
                        return;
                    }
                    codepoints.push(cp);
                    ++i;
                }
                return codepoints;
            };
        }
    }, function (line) {
        if (type.includes('mapping')) {
            if (line.length == 1 && line.charCodeAt(0) == 26)
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
    }, function () {
        global_encodings[name] = encoding;
        completion();
    });
}
function codepointsToEncoding(encoding, codepoints) {
    return global_encodings[encoding].encode(codepoints);
}
function codeUnitsToCodepoints(encoding, codeUnits) {
    return global_encodings[encoding].decode(codeUnits);
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
        }
        else if (format.includes('Octal')) {
            str = b.toString(8);
        }
        else if (format.includes('Decimal')) {
            str = b.toString(10);
        }
        else if (format.includes('Hexadecimal')) {
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
function textToBytes(format, strings) {
    if (format.includes('Prefixed with ')) {
        var prefix = format.substring(format.indexOf('\'') + 1, format.lastIndexOf('\''));
        for (var i = 0; i < strings.length; ++i) {
            strings[i] = strings[i].substring(prefix.length);
        }
    }
    var bytes = [];
    for (var i = 0; i < strings.length; ++i) {
        var str = strings[i];
        if (format.includes('Binary')) {
            bytes.push(parseInt(str, 2));
        }
        else if (format.includes('Octal')) {
            bytes.push(parseInt(str, 8));
        }
        else if (format.includes('Decimal')) {
            bytes.push(parseInt(str, 10));
        }
        else if (format.includes('Hexadecimal')) {
            bytes.push(parseInt(str, 16));
        }
    }
    return bytes;
}
function stringForJoiner(joiner) {
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
function joinBytes(joiner, bytes) {
    return bytes.join(stringForJoiner(joiner));
}
function splitBytes(joiner, str) {
    return str.split(stringForJoiner(joiner));
}
function hexadecimalPaddingFromEncoding(encoding) {
    if (encoding.includes('16-bit code units'))
        return 4;
    if (encoding.includes('32-bit code units'))
        return 8;
    return 2;
}
function encodeOutput(byteOrderMark, encoding, format, joiner, codepoints) {
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
    }
    else if (typeof bytes == 'string') {
        var outputString = bytes;
        return escapeHtml(outputString);
    }
    var chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
    return escapeHtml(joinBytes(joiner, chars));
}
function decodeOutput(byteOrderMark, encoding, format, joiner, str) {
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
