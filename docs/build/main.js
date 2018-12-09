function requestAsync(url, before, each, after) {
    const req = new XMLHttpRequest();
    req.open(`GET`, url, true);
    req.onload = function () {
        const str = req.response;
        const lines = str.split('\n');
        if (before)
            before(lines);
        if (each) {
            for (let i = 0; i < lines.length; ++i) {
                let line = lines[i];
                if (line.length === 0 || line[0] == `#`) {
                    continue;
                }
                if (line.indexOf(`#`) != -1) {
                    line = line.substring(0, line.indexOf(`#`));
                }
                each(line);
            }
        }
        if (after) {
            after();
        }
    };
    req.send(null);
}
function callMultipleAsync(functions, completion) {
    let count = 0;
    const callback = function () {
        ++count;
        if (count == functions.length) {
            completion();
        }
    };
    for (let i = 0; i < functions.length; ++i) {
        functions[i](callback);
    }
}
function initBlockData(completion) {
    let html = ``;
    for (let i = 0; i < global_blockRanges.length; ++i) {
        const b = global_blockRanges[i];
        html += `<option data-block="${b.blockName}">` +
            `${b.blockName} (from U+${itos(b.startCodepoint, 16, 4)} to U+${itos(b.endCodepoint, 16, 4)})</option>`;
    }
    updateSelectOptions(`.all-blocks`, html);
    completion();
}
function getBlockForCodepoint(codepoint) {
    for (let i = 0; i < global_blockRanges.length; ++i) {
        if (codepoint >= global_blockRanges[i].startCodepoint &&
            codepoint <= global_blockRanges[i].endCodepoint) {
            return global_blockRanges[i].blockName;
        }
    }
    return `No_Block`;
}
function getSyllableTypeForCodepoint(codepoint) {
    for (let i = 0; i < global_syllableRanges.length; ++i) {
        if (codepoint >= global_syllableRanges[i].startCodepoint &&
            codepoint <= global_syllableRanges[i].endCodepoint) {
            return global_syllableRanges[i].syllableType;
        }
    }
    return `Not_Applicable`;
}
function getShortJamoName(codepoint) {
    return global_shortJamoNames[codepoint];
}
function getScriptForCodepoint(codepoint) {
    for (let i = 0; i < global_scriptRanges.length; ++i) {
        if (codepoint >= global_scriptRanges[i].startCodepoint &&
            codepoint <= global_scriptRanges[i].endCodepoint) {
            return global_scriptRanges[i].scriptName;
        }
    }
    return `Unknown`;
}
function getCharacterCategoryCode(codepoint) {
    let categoryCode = global_category[codepoint];
    if (!categoryCode) {
        for (let i = 0; i < global_categoryRanges.length; ++i) {
            const range = global_categoryRanges[i];
            if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
                categoryCode = range.categoryCode;
                break;
            }
        }
    }
    return categoryCode;
}
function getCharacterCategoryName(codepoint) {
    const categoryCode = getCharacterCategoryCode(codepoint);
    return global_generalCategoryNames[categoryCode] || `Unknown`;
}
function getCodepointDescription(codepoint, name) {
    if (typeof codepoint == `string`) {
        codepoint = parseInt(codepoint);
    }
    return `${name} ${ctos([codepoint])}`;
}
function decompomposeHangulSyllable(codepoint) {
    const syllableType = getSyllableTypeForCodepoint(codepoint);
    if (syllableType == `Not_Applicable`)
        return [codepoint];
    // see Unicode Standard, section 3.12 "Conjoining Jamo Behavior", "Hangul Syllable Decomposition"
    const SBase = 0xAC00;
    const LBase = 0x1100;
    const VBase = 0x1161;
    const TBase = 0x11A7;
    const LCount = 19;
    const VCount = 21;
    const TCount = 28;
    const NCount = VCount * TCount; // 588
    const SCount = LCount * NCount; // 11172
    const SIndex = codepoint - SBase;
    const LIndex = Math.floor(SIndex / NCount);
    const VIndex = Math.floor((SIndex % NCount) / TCount);
    const TIndex = SIndex % TCount;
    const LPart = LBase + LIndex;
    const VPart = VBase + VIndex;
    if (TIndex > 0) {
        return [LPart, VPart, TBase + TIndex];
    }
    else {
        return [LPart, VPart];
    }
}
function getName(codepoint, search = false) {
    let d = global_data[codepoint];
    if (d) {
        if (d[0] != `<`)
            return d;
        else
            return ``;
    }
    if (0xAC00 <= codepoint && codepoint <= 0xD7AF) {
        const decomposedSyllables = decompomposeHangulSyllable(codepoint);
        const shortJamoNames = [];
        for (let i = 0; i < decomposedSyllables.length; ++i)
            shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
        return `HANGUL SYLLABLE ${shortJamoNames.join(``)}`;
    }
    if ((0x3400 <= codepoint && codepoint <= 0x4DBF) ||
        (0x4E00 <= codepoint && codepoint <= 0x9FFF)) {
        if (search)
            return `CJK UNIFIED IDEOGRAPH`;
        return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
    }
    for (let i = 0; i < global_ranges.length; ++i) {
        const range = global_ranges[i];
        if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
            if (range.rangeName.startsWith(`CJK Ideograph`)) {
                if (search)
                    return `CJK UNIFIED IDEOGRAPH`;
                return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
            }
        }
    }
    return ``;
}
function getHtmlNameDescription(codepoint) {
    if (getName(codepoint) !== ``)
        return getName(codepoint);
    if (global_data[codepoint] == `<control>`) {
        const name = [];
        for (let i = 0; i < global_aliases.length; ++i) {
            if (global_aliases[i].codepoint == codepoint) {
                if (global_aliases[i].type != `control` && name.length > 0)
                    break;
                name.push(global_aliases[i].alias);
                if (global_aliases[i].type != `control`)
                    break;
            }
        }
        if (name.length > 0)
            return `<i>${name.join(` / `)}</i>`;
    }
    return `<i>Unknown-${itos(codepoint, 16, 4)}</i>`;
}
function getUnicodeDataTxtNameField(codepoint) {
    if (global_data[codepoint])
        return global_data[codepoint];
    for (let i = 0; i < global_ranges.length; ++i) {
        const range = global_ranges[i];
        if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint)
            return range.rangeName;
    }
    return `Unknown`;
}
let global_encodings = {};
function escapeHtml(string) {
    return he.encode(string);
}
function displayCodepoint(codepoint) {
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
function ctos(codepoints) {
    return punycode.ucs2.encode(codepoints);
}
function stoc(string) {
    return punycode.ucs2.decode(string);
}
function ctou8(codepoints) {
    const u8str = utf8.encode(ctos(codepoints));
    const res = [];
    for (let i = 0; i < u8str.length; ++i)
        res.push(u8str.charCodeAt(i));
    return res;
}
function u8toc(bytes) {
    let u8str = ``;
    for (let i = 0; i < bytes.length; ++i)
        u8str += String.fromCharCode(bytes[i]);
    return stoc(utf8.decode(u8str));
}
function itos(int, base, padding = 0) {
    let res = int.toString(base).toUpperCase();
    while (res.length < padding) {
        res = `0` + res;
    }
    return res;
}
function initializeMappings(completion) {
    for (let i in global_encodingData) {
        let encodingData = global_encodingData[i];
        loadEncodingFromData(encodingData.type, encodingData.name, encodingData.data);
    }
    let codepageOptionStrings = ``;
    let outputEncodingOptionStrings = ``;
    let mojibakeOptionStrings = ``;
    $.each(global_encodingNames, function (i, encodingName) {
        if (global_encodings[encodingName].type == `7-bit mapping` ||
            global_encodings[encodingName].type == `8-bit mapping`) {
            codepageOptionStrings += `<option${encodingName == `ISO-8859-1 (Latin-1 Western European)` ? ` selected` : ``}>${encodingName}</option>`;
        }
        outputEncodingOptionStrings += `<option>${encodingName}</option>`;
        mojibakeOptionStrings += `<option>${encodingName}</option>`;
    });
    updateSelectOptions(`#codepageEncoding`, codepageOptionStrings);
    updateSelectOptions(`#outputEncoding`, outputEncodingOptionStrings);
    updateSelectOptions(`#mojibakeEncodings`, mojibakeOptionStrings);
    completion();
}
function loadEncodingFromData(type, name, data) {
    let encoding = {
        type: type,
        encode: undefined,
        decode: undefined
    };
    let lines = data.split('\n');
    if (type.includes(`function`)) {
        encoding = eval(lines.join(`\n`));
        encoding.type = type;
    }
    else {
        encoding.encode = function (codepoints) {
            let bytes = [];
            for (let i = 0; i < codepoints.length; ++i) {
                let codepoint = codepoints[i];
                if (typeof codepoint == `string`) {
                    codepoint = parseInt(codepoint);
                }
                const number = encoding.table[codepoint];
                if (typeof number == `undefined`) {
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
            const table = encoding.table;
            const codepointForByteUsingMapping = function (byte) {
                if (typeof byte == `string`) {
                    byte = parseInt(byte);
                }
                for (let codepoint in table) {
                    if (byte == table[codepoint])
                        return parseInt(codepoint);
                }
            };
            const codepoints = [];
            for (let i = 0; i < bytes.length; ++i) {
                let cp = codepointForByteUsingMapping(bytes[i]);
                if (typeof cp != `undefined`) {
                    codepoints.push(cp);
                    continue;
                }
                cp = codepointForByteUsingMapping((bytes[i] << 8) + bytes[i + 1]);
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
function codepointsToEncoding(encoding, codepoints) {
    return global_encodings[encoding].encode(codepoints);
}
function codeUnitsToCodepoints(encoding, codeUnits) {
    return global_encodings[encoding].decode(codeUnits);
}
function bytesToText(format, bytes, hexadecimalPadding) {
    const chars = [];
    for (let i = 0; i < bytes.length; ++i) {
        const b = bytes[i];
        let str = ``;
        if (format.includes(`Binary`)) {
            str = b.toString(2);
            if (format.includes(`Padded`)) {
                str = (Array(hexadecimalPadding * 4 + 1).join(`0`) + str).substring(str.length);
            }
        }
        else if (format.includes(`Octal`)) {
            str = b.toString(8);
        }
        else if (format.includes(`Decimal`)) {
            str = b.toString(10);
        }
        else if (format.includes(`Hexadecimal`)) {
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
function textToBytes(format, strings) {
    if (format.includes(`Prefixed with `)) {
        const prefix = format.substring(format.indexOf(`'`) + 1, format.lastIndexOf(`'`));
        for (let i = 0; i < strings.length; ++i) {
            strings[i] = strings[i].substring(prefix.length);
        }
    }
    const bytes = [];
    for (let i = 0; i < strings.length; ++i) {
        const str = strings[i];
        if (format.includes(`Binary`)) {
            bytes.push(parseInt(str, 2));
        }
        else if (format.includes(`Octal`)) {
            bytes.push(parseInt(str, 8));
        }
        else if (format.includes(`Decimal`)) {
            bytes.push(parseInt(str, 10));
        }
        else if (format.includes(`Hexadecimal`)) {
            bytes.push(parseInt(str, 16));
        }
    }
    return bytes;
}
function stringForJoiner(joiner) {
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
function joinBytes(joiner, bytes) {
    return bytes.join(stringForJoiner(joiner));
}
function splitBytes(joiner, str) {
    return str.split(stringForJoiner(joiner));
}
function hexadecimalPaddingFromEncoding(encoding) {
    if (encoding.includes(`16-bit code units`))
        return 4;
    if (encoding.includes(`32-bit code units`))
        return 8;
    return 2;
}
function encodeOutput(byteOrderMark, encoding, format, joiner, codepoints) {
    const useBOM = byteOrderMark.startsWith(`Use`);
    if (useBOM) {
        codepoints.unshift(0xFEFF);
    }
    const bytes = codepointsToEncoding(encoding, codepoints);
    if (typeof bytes == `number`) {
        // input contains codepoints incompatible with the selected encoding
        const invalidCodepoint = bytes;
        return `<span style="color: red">Text cannot be encoded in ${encoding} because it contains incompatible characters.\nThe first such incompatible character is U+${itos(invalidCodepoint, 16, 4)} - ${getHtmlNameDescription(invalidCodepoint)} (${displayCodepoint(invalidCodepoint)}).</span>`;
    }
    else if (typeof bytes == `string`) {
        const outputString = bytes;
        return escapeHtml(outputString);
    }
    const chars = bytesToText(format, bytes, hexadecimalPaddingFromEncoding(encoding));
    return escapeHtml(joinBytes(joiner, chars));
}
function decodeOutput(byteOrderMark, encoding, format, joiner, str) {
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
    if (!codepoints)
        return;
    const useBOM = byteOrderMark.startsWith(`Use`);
    if (useBOM) {
        codepoints.unshift(1);
    }
    return codepoints;
}
function isExtendedPictographic(codepoint) {
    for (const i in global_extendedPictograph) {
        if (global_extendedPictograph[i] == codepoint) {
            return true;
        }
    }
    return false;
}
function graphemeBreakValueForCodepoint(codepoint) {
    if (global_graphemeBreakData[codepoint])
        return global_graphemeBreakData[codepoint];
    return `Other`;
}
// Updated for revision 33
function countGraphemesForCodepoints(codepoints, useExtended) {
    if (codepoints.length === 0)
        return 0;
    // for GB12 and GB13
    let numberOfContinuousRegionalIndicatorSymbols = 0;
    let value1OfGB11 = false; // true if and only if LHS matches \p{Extended_Pictographic} Extend*
    let breaks = 0;
    for (let i = 1; i < codepoints.length; ++i) {
        // increment `breaks` if we should break between codepoints[i-1] and codepoints[i]
        const value1 = graphemeBreakValueForCodepoint(codepoints[i - 1]);
        const value2 = graphemeBreakValueForCodepoint(codepoints[i]);
        // see http://unicode.org/reports/tr29/#Grapheme_Cluster_Boundary_Rules for descriptions of grapheme cluster boundary rules
        // skip rules GB1 and GB2 as they deal with SOT and EOT and thus don`t affect the number of graphemes in a string
        // Nontrivial rules:
        // handle value1 of GB12 and GB13
        //   GB12:     ^ (RI RI)* RI × ...
        //   GB13: [^RI] (RI RI)* RI × ...
        // they match if there is an odd number of Regional_Indicator codepoints on the left-hand side
        if (value1 == `Regional_Indicator`) {
            ++numberOfContinuousRegionalIndicatorSymbols;
        }
        else {
            numberOfContinuousRegionalIndicatorSymbols = 0;
        }
        if (value1 == `CR` && value2 == `LF`) { // GB3
        }
        else if (value1 == `Control` || value1 == `CR` || value1 == `LF`) { // GB4
            ++breaks;
        }
        else if (value2 == `Control` || value2 == `CR` || value2 == `LF`) { // GB5
            ++breaks;
        }
        else if (value1 == `L` && (value2 == `L` || value2 == `V` || value2 == `LV` || value2 == `LVT`)) { // GB6
        }
        else if ((value1 == `LV` || value1 == `V`) && (value2 == `V` || value2 == `T`)) { // GB7
        }
        else if ((value1 == `LVT` || value1 == `T`) && value2 == `T`) { // GB8
        }
        else if (value2 == `Extend` || value2 == `ZWJ`) { // GB9
        }
        else if (useExtended && value2 == `SpacingMark`) { // GB9a
        }
        else if (useExtended && value1 == `Prepend`) { // GB9b
        }
        else if (value1OfGB11 && value1 == `ZWJ` && isExtendedPictographic(codepoints[i])) { // GB11
        }
        else if (numberOfContinuousRegionalIndicatorSymbols % 2 == 1 && value2 == `Regional_Indicator`) { // GB12 and GB13
        }
        else { // GB999
            ++breaks;
        }
        // GB10 LHS: (E_Base | E_Base_GAZ) Extend* × ...
        if (isExtendedPictographic(codepoints[i - 1])) {
            value1OfGB11 = true;
        }
        else if (value1 == `Extend` && value1OfGB11 === true) {
            // do nothing
        }
        else {
            value1OfGB11 = false;
        }
    }
    return breaks + 1;
}
function initLanguageData(completion) {
    const showAllLanguages = $(`#showRareLanguages`)[0].hasAttribute(`disabled`);
    const htmls = showAllLanguages ? global_allLanguageTagsHTML : global_commonLanguageTagsHTML;
    updateSelectOptions(`#languageList`, htmls[`language`]);
    updateSelectOptions(`#scriptList`, htmls[`script`]);
    updateSelectOptions(`#regionList`, htmls[`region`]);
    updateSelectOptions(`#variantList`, htmls[`variant`]);
    $(`#showRareLanguages`).on(`click`, function () {
        $(`#showRareLanguages`).attr(`disabled`, `disabled`);
        initLanguageData(() => { });
    });
    completion();
}
function jQueryModal(sel, operation) {
    $(sel).modal(operation);
}
let global_useInternalString = false;
let global_internalString = [];
let global_event_listeners = [{
        tabId: `settings`,
        elementId: `output`,
        f: updateUseInternalString
    }, {
        tabId: `mojibake`,
        elementId: `output`,
        f: updateMojibake
    }, {
        tabId: `codepages`,
        elementId: `output`,
        f: updateRenderedCodepage
    }, {
        tabId: `stats`,
        elementId: `output`,
        f: updateEncodedLengths
    }, {
        tabId: `codepoints`,
        elementId: `output`,
        f: updateCodepointList
    }, {
        tabId: `encode`,
        elementId: `output`,
        f: updateEncodedAndDecodedStrings
    }, {
        tabId: `settings`,
        elementId: `output`,
        f: updateLanguage
    }];
function callEventListenersForElemId(elemId) {
    for (let i = 0; i < global_event_listeners.length; ++i) {
        const listener = global_event_listeners[i];
        if (listener.elementId != elemId)
            continue;
        if (listener.tabId) {
            if (!$(`#${listener.tabId}`).hasClass(`active`))
                continue;
        }
        listener.f();
    }
}
function getStr() {
    return global_useInternalString ? global_internalString : stoc($(`#output`).val());
}
function setStr(str) {
    global_internalString = str;
    $(`#output`).val(ctos(str));
}
function output(codepoint) {
    setStr(getStr().concat([codepoint]));
    updateInfo();
}
function updateSuggestions() {
    const input = $(`#input`).val();
    const results = searchCodepoints(input);
    renderCodepointsInTable(results, `searchResults`, [{ displayName: `Insert`, functionName: `output` }]);
}
function normalizeString(form) {
    if (!String.prototype.normalize) {
        alert(`Your browser currently does not support string normalization.`);
        return;
    }
    setStr(stoc(ctos(getStr()).normalize(form)));
    updateInfo();
}
function updateInfo() {
    const codepoints = getStr();
    setStr(codepoints);
    callEventListenersForElemId(`output`);
    let url = location.href.indexOf(`?`) == -1
        ? location.href
        : location.href.substring(0, location.href.indexOf(`?`));
    if (codepoints.length > 0) {
        url += `?c=${codepoints.join(`,`)}`;
    }
    history.replaceState({}, ``, url);
}
function deleteAtIndex(codepoint, index) {
    const codepoints = getStr();
    codepoints.splice(index, 1);
    setStr(codepoints);
    updateInfo();
}
function moveUp(codepoint, index) {
    const codepoints = getStr();
    const c = codepoints[index];
    codepoints[index] = codepoints[index - 1];
    codepoints[index - 1] = c;
    setStr(codepoints);
    updateInfo();
}
function moveDown(codepoint, index) {
    const codepoints = getStr();
    const c = codepoints[index];
    codepoints[index] = codepoints[index + 1];
    codepoints[index + 1] = c;
    setStr(codepoints);
    updateInfo();
}
function initData(completion) {
    callMultipleAsync([
        initializeMappings,
        initBlockData,
        initLanguageData
    ], completion);
}
function updateSpacerHeights() {
    $(`.fixed`).each(function (i, e) {
        const spacerId = $(e).attr(`data-spacer-id`);
        const spacer = $(`#${spacerId}`);
        const extraHeight = spacer.attr(`data-extra-height`)
            ? parseFloat($(spacer).attr(`data-extra-height`))
            : 0;
        spacer.height($(e).height() + extraHeight);
    });
}
let loaded = false;
$(document).ready(function () {
    if (loaded)
        return;
    loaded = true;
    $(`select`).chosen({ disable_search_threshold: 10, width: `100%` });
    updateSpacerHeights();
    const startTime = new Date();
    initData(function () {
        initializeSearchStrings();
        window.onpopstate = function () {
            const args = location.search.substring(1).split(`&`);
            for (let i = 0; i < args.length; ++i) {
                const arg = args[i].split(`=`);
                if (arg[0] == `c`) {
                    setStr(arg[1].split(`,`).map((str) => parseInt(str)));
                }
                else if (arg[0] == `info`) {
                    showCodepageDetail(parseInt(arg[1]));
                }
            }
        };
        window.onpopstate(new PopStateEvent(``));
        const loadDuration = new Date() - startTime; // in ms
        updateInfo();
        updateSuggestions();
        $(`#input`).on(`keyup`, function (e) {
            if (e.keyCode == 13) {
                const input = $(`#input`).val();
                if (isNaN(parseInt(input.replace(`U+`, ``), 16))) {
                    document.body.style.backgroundColor = `#fdd`;
                    setTimeout(function () {
                        document.body.style.backgroundColor = `#fff`;
                    }, 1000);
                }
                else {
                    output(parseInt(input.replace(`U+`, ``), 16));
                    $(`#input`).val(``);
                }
            }
        });
        $(`#input`).on(`input`, function (e) {
            updateSuggestions();
        });
        $(`#searchBlock`).on(`change`, function (e) {
            updateSuggestions();
        });
        $(`#output, #encodedInput`).on(`input`, function () {
            updateInfo();
        });
        $(`select`).on(`change`, function () {
            updateInfo();
        });
        setInterval(function () {
            updateSpacerHeights();
        }, 1000);
        $(`a[data-toggle="tab"]`).on(`shown.bs.tab`, function (e) {
            updateSpacerHeights();
            callEventListenersForElemId(`output`);
        });
        // This should be on `input` instead, but this doesn't fire on
        //  Safari. See https://caniuse.com/#feat=input-event (#4)
        //  and specifically https://bugs.webkit.org/show_bug.cgi?id=149398
        $(`#useInternalString`).on(`change`, function () {
            updateUseInternalString();
        });
        $(`#languageCode`).on(`input`, function () {
            updateLanguage();
        });
        console.log(`Loaded in ${loadDuration}ms`);
    });
});
let global_search_strings = [];
function getSearchString(codepoint) {
    let res = `${ctos([codepoint])}|U+${itos(codepoint, 16, 4)}|cp:${codepoint}|name:${getName(codepoint, true)}|script:${getScriptForCodepoint(codepoint).replace(/_/g, ` `)}|category:${getCharacterCategoryName(codepoint)}`;
    for (let i = 0; i < global_aliases.length; ++i) {
        if (global_aliases[i].codepoint == codepoint) {
            res += `|name:${global_aliases[i].alias}`;
        }
    }
    if (global_han_meanings[codepoint])
        res += global_han_meanings[codepoint];
    if (global_kun_readings[codepoint])
        res += `|kun:${global_kun_readings[codepoint].split(`, `).join(`|kun:`)}`;
    if (global_on_readings[codepoint])
        res += `|on:${global_on_readings[codepoint].split(`, `).join(`|on:`)}`;
    if (global_mandarin_readings[codepoint])
        res += `|mandarin:${global_mandarin_readings[codepoint].split(`, `).join(`|mandarin:`)}`;
    return res.toUpperCase();
}
function initializeSearchStrings() {
    for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
        const range = global_all_assigned_ranges[i];
        const end = range.endCodepoint;
        for (let c = range.startCodepoint; c <= end; ++c) {
            global_search_strings[c] = getSearchString(c);
        }
    }
}
function testSearch(searchString, words) {
    if (!searchString.includes(words[0]))
        return false;
    for (let i = 1; i < words.length; ++i) {
        if (!searchString.includes(words[i]))
            return false;
    }
    return true;
}
function searchCodepoints(str) {
    const results = [];
    str = str.toUpperCase();
    const words = str.split(`,`);
    for (let i = 0; i < words.length; ++i) {
        words[i] = words[i].trim();
    }
    const selectedElements = $(`#searchBlock option:selected`);
    const blocks = [];
    for (let i = 0; i < selectedElements.length; ++i) {
        const block = selectedElements[i].getAttribute(`data-block`);
        if (block) {
            blocks.push(block);
        }
    }
    for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
        const range = global_all_assigned_ranges[i];
        const end = range.endCodepoint;
        for (let c = range.startCodepoint; c <= end; ++c) {
            if (blocks.length > 0 && blocks.indexOf(getBlockForCodepoint(c)) == -1)
                continue;
            const searchString = global_search_strings[c];
            if (!searchString)
                continue;
            if (testSearch(searchString, words)) {
                results.push(c);
                if (results.length >= 256)
                    return results;
            }
        }
    }
    return results;
}
function assert(expr, message) {
    if (!expr)
        throw message;
}
function assertEqual(actual, expected, otherInfo) {
    if (actual != expected)
        throw `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
}
const tests = [
    function () {
        for (let cp = 0; cp < 0x300; ++cp) {
            const block = getBlockForCodepoint(cp);
            if (cp <= 0x7F)
                assertEqual(block, `Basic Latin`, `Codepoint ${itos(cp, 16, 4)}`);
            else if (cp <= 0xFF)
                assertEqual(block, `Latin-1 Supplement`, `Codepoint ${itos(cp, 16, 4)}`);
            else if (cp <= 0x17F)
                assertEqual(block, `Latin Extended-A`, `Codepoint ${itos(cp, 16, 4)}`);
            else if (cp <= 0x24F)
                assertEqual(block, `Latin Extended-B`, `Codepoint ${itos(cp, 16, 4)}`);
            else if (cp <= 0x2AF)
                assertEqual(block, `IPA Extensions`, `Codepoint ${itos(cp, 16, 4)}`);
            else if (cp <= 0x2FF)
                assertEqual(block, `Spacing Modifier Letters`, `Codepoint ${itos(cp, 16, 4)}`);
        }
    }, function () {
        assertEqual(countGraphemesForCodepoints([128104, 8205, 10084, 65039, 8205, 128104], true), 1);
        assertEqual(countGraphemesForCodepoints([
            128104, 8205, 10084, 65039, 8205, 128104,
            128104, 8205, 10084, 65039, 8205, 128104,
            128104, 8205, 10084, 65039, 8205, 128104
        ], true), 3);
        assertEqual(countGraphemesForCodepoints([127464, 127467, 127470, 127464, 127463, 127481, 127464], true), 4);
    }
];
function runTests() {
    for (let i = 0; i < tests.length; ++i) {
        const test = tests[i];
        try {
            test();
        }
        catch (e) {
            $(`#unit-tests-text`).text(`Test #${i + 1} failed: ${e}`);
            jQueryModal(`#unit-tests-modal`, `show`);
            return;
        }
    }
    $(`#unit-tests-text`).text(`All ${tests.length} tests passed.`);
    jQueryModal(`#unit-tests-modal`, `show`);
}
let global_colorMap = {
    'C': `#f97e77`,
    'L': `#f9e776`,
    'N': `#b7f976`,
    'P': `#76f9ee`,
    'S': `#7680f9`,
    'Z': `#a8a8a8`,
};
function renderCodepointsInTable(codepoints, tableId, buttons) {
    const table = $(`#${tableId}`);
    if (codepoints.length === 0) {
        table.html(``);
        return;
    }
    let html = `
	<thead>
		<tr>
			<th></th>
			<th>Codepoint (Hex)</th>
			<th>Codepoint (Decimal)</th>
			<th>Character</th>
			<th>Category</th>
			<th>Name</th>
		</tr>
	</thead>
	<tbody>`;
    let i = 0;
    for (i = 0; i < codepoints.length; ++i) {
        const codepoint = codepoints[i];
        let buttonStr = ``;
        for (const j in buttons) {
            const buttonDescription = buttons[j];
            let disabled = ``;
            if (buttonDescription.require) {
                if (!buttonDescription.require(i, codepoints.length)) {
                    disabled = `disabled`;
                }
            }
            buttonStr += `<input
				type="button" ${disabled}
				onclick="${buttonDescription.functionName}(${codepoint}, ${i})"
				value="${buttonDescription.displayName}">`;
        }
        html += `
		<tr>
			<td>${buttonStr}</td>
			<td>U+${itos(codepoint, 16, 4)}</td>
			<td>${codepoint}</td>
			<td>${displayCodepoint(codepoint)}</td>
			<td>${getCharacterCategoryName(codepoint)}</td>
			<td style="cursor: pointer;" onclick="showCodepageDetail(${codepoint})">${getHtmlNameDescription(codepoint)}</td>
		</tr>`;
    }
    if (i >= 256) {
        html += `<tr><td colspan="6">Showing only the first 256 rows.</td></tr>`;
    }
    html += `</tbody>`;
    table.hide();
    table.html(html);
    table.show();
}
function randomColorForKey(key) {
    if (global_colorMap[key]) {
        return global_colorMap[key];
    }
    return global_colorMap[key] = randomColor({
        luminosity: `light`
    });
}
function updateRenderedCodepage() {
    const encodingName = $(`#codepageEncoding option:selected`).text();
    const encoding = global_encodings[encodingName];
    const isAscii = encoding.type == `7-bit mapping`;
    let html = `<thead><th></th>`;
    for (let i = 0; i < 16; ++i) {
        html += `<th>_${i.toString(16).toUpperCase()}</th>`;
    }
    html += `</thead><tbody>`;
    for (let i = 0; i < (isAscii ? 8 : 16); ++i) {
        html += `<tr><td style="font-weight:bold">${i.toString(16).toUpperCase()}_</td>`;
        for (let j = 0; j < 16; ++j) {
            const byte = (i << 4) + j;
            const codepoints = encoding.decode([byte]);
            if (codepoints && codepoints.length > 0) {
                const codepoint = codepoints[0];
                const color = randomColorForKey(getCharacterCategoryCode(codepoint)[0]);
                const displayedCodepoint = displayCodepoint(codepoint);
                html += `<td style="cursor: pointer; background-color: ${color};" onclick="showCodepageDetail(${codepoint})">${i.toString(16).toUpperCase()}${j.toString(16).toUpperCase()}<br>${displayedCodepoint}</td>`;
            }
            else {
                html += `<td style="background-color: white">${i.toString(16).toUpperCase()}${j.toString(16).toUpperCase()}<br>&nbsp;</td>`;
            }
        }
        html += `</tr>`;
    }
    html += `</tbody>`;
    $(`#codepage`).html(html);
}
function showCodepageDetail(codepoint) {
    $(`#detail-codepoint-hex`).text(itos(codepoint, 16, 4));
    $(`#detail-codepoint-decimal`).text(codepoint);
    $(`#detail-name`).html(`"${getName(codepoint)}"`);
    $(`#detail-character`).html(displayCodepoint(codepoint));
    $(`#detail-character-raw`).text(ctos([codepoint]));
    $(`#detail-character-textbox`).val(ctos([codepoint]));
    $(`#detail-category`).text(`${getCharacterCategoryCode(codepoint)} (${getCharacterCategoryName(codepoint)})`);
    $(`#detail-block`).text(getBlockForCodepoint(codepoint).replace(/_/g, ` `));
    $(`#detail-script`).text(getScriptForCodepoint(codepoint).replace(/_/g, ` `));
    const matchingAliases = [];
    for (let i = 0; i < global_aliases.length; ++i) {
        if (global_aliases[i].codepoint == codepoint)
            matchingAliases.push(global_aliases[i].alias);
    }
    if (matchingAliases.length === 0) {
        $(`#detail-aliases`).hide();
    }
    else {
        $(`#detail-aliases`).show();
        $(`#detail-aliases-list`).text(matchingAliases.join(`, `));
    }
    const meaning = global_han_meanings[codepoint];
    if (meaning) {
        $(`#detail-meaning`).show();
        $(`#detail-meaning-content`).text(meaning);
    }
    else {
        $(`#detail-meaning`).hide();
    }
    const mandarin = global_mandarin_readings[codepoint];
    if (mandarin) {
        $(`#detail-mandarin`).show();
        $(`#detail-mandarin-content`).text(mandarin);
    }
    else {
        $(`#detail-mandarin`).hide();
    }
    const kun = global_kun_readings[codepoint];
    if (kun) {
        $(`#detail-kun`).show();
        $(`#detail-kun-content`).text(kun);
    }
    else {
        $(`#detail-kun`).hide();
    }
    const on = global_on_readings[codepoint];
    if (on) {
        $(`#detail-on`).show();
        $(`#detail-on-content`).text(on);
    }
    else {
        $(`#detail-on`).hide();
    }
    const variationSequences = variationSequencesForCodepoint(codepoint).concat(ideographicVariationSequencesForCodepoint(codepoint));
    if (variationSequences.length === 0) {
        $(`#detail-variation-sequences`).hide();
    }
    else {
        $(`#detail-variation-sequences`).show();
        let variationsString = ``;
        for (let i = 0; i < variationSequences.length; ++i) {
            let vs = variationSequences[i];
            if (variationsString !== ``)
                variationsString += `<br>`;
            if (!vs.shapingEnvironments)
                vs.shapingEnvironments = [];
            variationsString += `U+${itos(vs.baseCodepoint, 16, 4)} U+${itos(vs.variationSelector, 16, 4)}: ${escapeHtml(ctos([vs.baseCodepoint, vs.variationSelector]))} <i>${vs.description}`;
            if (vs.shapingEnvironments.length > 0) {
                variationsString += ` (${vs.shapingEnvironments.join(`, `)})</i>`;
            }
            else {
                variationsString += `</i>`;
            }
        }
        $(`#detail-variation-sequences-content`).html(variationsString);
    }
    let encodingsString = ``;
    $(`#outputEncoding option`).each(function (i, e) {
        const encoding = $(e).text();
        const html = encodeOutput($(`#byteOrderMark option:selected`).text(), encoding, $(`#outputFormat option:selected`).text(), $(`#outputJoiner option:selected`).text(), [codepoint]);
        if (html.startsWith(`<span`))
            return;
        encodingsString += `${encoding}: ${html}\n`;
    });
    $(`#detail-encoding-outputs`).html(encodingsString);
    $(`#detail-previous-cp`).attr(`data-cp`, codepoint != 0 ? itos(codepoint - 1, 10) : itos(0x10FFFF, 10));
    $(`#detail-next-cp`).attr(`data-cp`, codepoint != 0x10FFFF ? itos(codepoint + 1, 10) : itos(0, 10));
    jQueryModal(`#codepoint-detail`, `show`);
}
function changeDetail(elem) {
    $(elem).blur(); // remove focus
    const codepointToShow = parseInt($(elem).attr(`data-cp`), 10);
    showCodepageDetail(codepointToShow);
}
function initLicenseInfo(completion) {
    requestAsync(`data/licenses.html`, function (lines) {
        $(`#licenses-text`).html(lines.join(`\n`));
        completion();
    });
}
function updateMojibake() {
    const codepoints = getStr();
    const mojibakeOutputs = [];
    $(`#mojibakeEncodings option`).each(function (i, e) {
        if (!e.selected)
            return;
        const encoding1Name = $(e).text();
        if (global_encodings[encoding1Name].type == `text function`)
            return;
        const encodedString = encodeOutput(`Don't use a byte order mark`, encoding1Name, `Decimal`, `Separated using commas and spaces`, codepoints);
        if (encodedString.startsWith(`<`))
            return;
        $(`#mojibakeEncodings option`).each(function (j, f) {
            if (i == j)
                return;
            if (!f.selected)
                return;
            const encoding2Name = $(f).text();
            if (global_encodings[encoding2Name].type == `text function`)
                return;
            const decodedString = decodeOutput(`Don't use a byte order mark`, encoding2Name, `Decimal`, `Separated using commas and spaces`, encodedString);
            if (!decodedString)
                return;
            mojibakeOutputs.push({
                encoding1Name: encoding1Name,
                encoding2Name: encoding2Name,
                text: ctos(decodedString)
            });
        });
    });
    let mojibakeOutputStr = ``;
    let lastEncoding1 = ``;
    for (let i = 0; i < mojibakeOutputs.length; ++i) {
        const o = mojibakeOutputs[i];
        if (o.encoding1Name != lastEncoding1) {
            lastEncoding1 = o.encoding1Name;
            mojibakeOutputStr += `Assuming the input was erroneously interpreted as ${o.encoding1Name}:<br>`;
        }
        mojibakeOutputStr += `    If the original encoding was ${o.encoding2Name}:<br>        ${mojibakeOutputs[i].text}<br>`;
    }
    $(`#mojibakeOutput`).html(mojibakeOutputStr);
}
function updateEncodedLengths() {
    const codepoints = getStr();
    $(`#extendedGraphemeClusters`).text(countGraphemesForCodepoints(codepoints, true));
    $(`#legacyGraphemeClusters`).text(countGraphemesForCodepoints(codepoints, false));
    $(`#numCodepoints`).text(codepoints.length);
    let encodingLengthsStr = `<thead><tr>` +
        `<th>Encoding</th>` +
        `<th>Number of code units</th>` +
        `<th>Number of bytes</th>` +
        `<th>Number of code units (incl. BOM)</th>` +
        `<th>Number of bytes (incl. BOM)</th>` +
        `</tr></thead><tbody>`;
    let bomCodepoints = [0xFEFF];
    for (let i = 0; i < codepoints.length; ++i) {
        bomCodepoints.push(codepoints[i]);
    }
    for (const name in global_encodings) {
        const encoding = global_encodings[name];
        const codeUnits = encoding.encode(codepoints);
        const cellEntries = [``, ``, ``, ``];
        if (typeof codeUnits === `number`) {
            cellEntries[0] = `<span style="color:red">Unable to encode U+${itos(codeUnits, 16, 4)}</span>`;
            cellEntries[3] = cellEntries[2] = cellEntries[1] = cellEntries[0];
        }
        else {
            cellEntries[0] = `${codeUnits.length} code units`;
            cellEntries[1] = `${codeUnits.length * hexadecimalPaddingFromEncoding(name) / 2} bytes`;
            let bomCodeUnits = encoding.encode(bomCodepoints);
            if (typeof bomCodeUnits === `number`) {
                cellEntries[3] = cellEntries[2] = `<span style="color:red">Unable to encode BOM (U+FEFF)</span>`;
            }
            else {
                cellEntries[2] = `${bomCodeUnits.length} code units`;
                cellEntries[3] = `${bomCodeUnits.length * hexadecimalPaddingFromEncoding(name) / 2} bytes`;
            }
        }
        encodingLengthsStr += `<tr><td>${name}</td><td>${cellEntries.join(`</td><td>`)}</td></tr>`;
    }
    $(`#encodingLengths`).html(encodingLengthsStr + `</tbody>`);
    $(`#string`).html(escapeHtml(ctos(getStr())).replace(/\n/g, `<br>`));
}
function updateCodepointList() {
    const codepoints = getStr();
    renderCodepointsInTable(codepoints, `codepointlist`, [{
            displayName: `Delete`,
            functionName: `deleteAtIndex`
        }, {
            displayName: `Move up`,
            functionName: `moveUp`,
            require: function (i, length) { return i != 0; }
        }, {
            displayName: `Move down`,
            functionName: `moveDown`,
            require: function (i, length) { return i != length - 1; }
        }]);
}
function updateEncodedAndDecodedStrings() {
    const codepoints = getStr();
    $(`#encodedOutput`).html(encodeOutput($(`#byteOrderMark option:selected`).text(), $(`#outputEncoding option:selected`).text(), $(`#outputFormat option:selected`).text(), $(`#outputJoiner option:selected`).text(), codepoints));
    const decodedOutput = decodeOutput($(`#byteOrderMark option:selected`).text(), $(`#outputEncoding option:selected`).text(), $(`#outputFormat option:selected`).text(), $(`#outputJoiner option:selected`).text(), $(`#encodedInput`).val());
    if (decodedOutput)
        renderCodepointsInTable(decodedOutput, `decodedCodepoints`, [{ displayName: `Insert`, functionName: `output` }]);
}
function updateLanguage() {
    let lang = ``;
    const textboxCode = $(`#languageCode`).val();
    let dropdownCode = ``;
    const langComponentStrings = [
        $(`#languageList option:selected`).attr(`data-code`),
        $(`#scriptList option:selected`).attr(`data-code`),
        $(`#regionList option:selected`).attr(`data-code`),
        $(`#variantList option:selected`).attr(`data-code`)
    ];
    for (let i = 0; i < langComponentStrings.length; ++i) {
        const component = langComponentStrings[i];
        if (!component)
            continue;
        if (dropdownCode != ``)
            dropdownCode += `-`;
        dropdownCode += component;
    }
    // valid states:
    //   everything enabled, textboxCode and dropdownCode empty
    //   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
    //   dropdownCode empty: dropdown disabled
    if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
        $(`#languageCode`).val(``); // occurs when dropdownCode is reset to blank
    }
    if (textboxCode == `` && dropdownCode == ``) {
        $(`#languageCode`).removeAttr(`disabled`);
        $(`#languageList`).removeAttr(`disabled`);
        $(`#scriptList`).removeAttr(`disabled`);
        $(`#regionList`).removeAttr(`disabled`);
        $(`#variantList`).removeAttr(`disabled`);
        lang = ``;
    }
    else if (textboxCode == `` && dropdownCode != ``) {
        $(`#languageCode`).attr(`disabled`, `disabled`);
        $(`#languageList`).removeAttr(`disabled`);
        $(`#scriptList`).removeAttr(`disabled`);
        $(`#regionList`).removeAttr(`disabled`);
        $(`#variantList`).removeAttr(`disabled`);
        lang = dropdownCode;
        $(`#languageCode`).val(lang);
    }
    else if (textboxCode != `` && dropdownCode == ``) {
        $(`#languageCode`).removeAttr(`disabled`);
        $(`#languageList`).attr(`disabled`, `disabled`);
        $(`#scriptList`).attr(`disabled`, `disabled`);
        $(`#regionList`).attr(`disabled`, `disabled`);
        $(`#variantList`).attr(`disabled`, `disabled`);
        lang = textboxCode;
    }
    else {
        if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
            lang = dropdownCode;
            $(`#languageCode`).val(lang);
        }
        else {
            lang = textboxCode;
        }
    }
    $(`html`).attr(`lang`, lang);
    $(`html`).attr(`xml:lang`, lang);
}
function updateUseInternalString() {
    global_useInternalString = $(`#useInternalString`).is(`:checked`);
}
function updateSelectOptions(selector, html) {
    $(selector).html(html);
    $(selector).trigger(`chosen:updated`);
}
function variationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_variationSequences.length; ++i) {
        if (global_variationSequences[i].baseCodepoint == codepoint)
            results.push(global_variationSequences[i]);
    }
    return results;
}
function urlForIdeographicCollection(name) {
    for (let i = 0; i < global_ideographicVariationCollections.length; ++i) {
        const collection = global_ideographicVariationCollections[i];
        if (collection.name != name)
            continue;
        return collection.url;
    }
}
function ideographicVariationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_ideographicVariationSequences.length; ++i) {
        if (global_ideographicVariationSequences[i].b == codepoint) {
            var ivs = global_ideographicVariationSequences[i];
            results.push({
                baseCodepoint: ivs.b,
                variationSelector: ivs.v,
                description: `ideographic (entry ${ivs.i} in collection <a target="_blank" rel="noopener" href="${urlForIdeographicCollection(ivs.c)}">${ivs.c}</a>)`
            });
        }
    }
    return results;
}
