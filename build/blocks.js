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
