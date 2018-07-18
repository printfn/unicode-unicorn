let global_data = [];
let global_ranges = [];
let global_all_assigned_ranges = [{ startCodepoint: 0, endCodepoint: 0 }]; // this element is modified as data is loaded, so don't change it
let global_category = [];
let global_categoryRanges = [];
let global_aliases = [];
let global_generalCategoryNames = {};
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
function initAliasData(completion) {
    requestAsync(`data/Unicode/UCD/NameAliases.txt`, undefined, function (line) {
        const splitLine = line.split(`;`);
        const codepoint = parseInt(splitLine[0], 16);
        global_aliases.push({ codepoint: codepoint, alias: splitLine[1], type: splitLine[2] });
    }, completion);
    global_aliases.sort(function (a, b) {
        if (a.type == `control` && b.type != `control`)
            return 1;
        if (a.type != `control` && b.type == `control`)
            return -1;
        if (a.alias < b.alias)
            return 1;
        if (a.alias > b.alias)
            return -1;
        return 0;
    });
}
function initGeneralCategoryNames(completion) {
    requestAsync(`data/Unicode/UCD/PropertyValueAliases.txt`, undefined, function (line) {
        let splitLine = line.split(`#`);
        splitLine = splitLine[0];
        splitLine = splitLine.split(`;`);
        if (splitLine[0].trim() != `gc`)
            return;
        const gc = splitLine[1].trim();
        const gcAlias = splitLine[2].trim();
        global_generalCategoryNames[gc] = gcAlias.replace(/_/g, ` `);
    }, completion);
}
function initUnicodeData(completion) {
    let startCodepoint = 0;
    requestAsync(`data/Unicode/UCD/UnicodeData.txt`, undefined, function (line) {
        const data_line = line.split(`;`);
        if (data_line[1].endsWith(`, First>`)) {
            startCodepoint = parseInt(data_line[0], 16);
        }
        else if (data_line[1].endsWith(`, Last>`)) {
            const endCodepoint = parseInt(data_line[0], 16);
            global_ranges.push({
                startCodepoint: startCodepoint,
                endCodepoint: endCodepoint,
                rangeName: data_line[1].substring(1, data_line[1].length - 7)
            });
            if (data_line[1].startsWith(`<CJK Ideograph`) || data_line[1].startsWith(`<Hangul Syllable`)) {
                global_all_assigned_ranges.push({
                    startCodepoint: startCodepoint,
                    endCodepoint: endCodepoint
                });
            }
            global_categoryRanges.push({
                startCodepoint: startCodepoint,
                endCodepoint: endCodepoint,
                categoryCode: data_line[2]
            });
        }
        else {
            const codepoint = parseInt(data_line[0], 16);
            global_data[codepoint] = data_line[1];
            global_category[codepoint] = data_line[2];
            if (global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint >= codepoint - 1) {
                ++global_all_assigned_ranges[global_all_assigned_ranges.length - 1].endCodepoint;
            }
            else {
                global_all_assigned_ranges.push({ startCodepoint: codepoint, endCodepoint: codepoint });
            }
        }
    }, completion);
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
