async function initBlockData() {
    for (let i = 0; i < global_blockRanges.length; ++i) {
        const b = global_blockRanges[i];
    }
}

function getBlockForCodepoint(codepoint: number): string {
    for (let i = 0; i < global_blockRanges.length; ++i) {
        if (
            codepoint >= global_blockRanges[i].startCodepoint &&
            codepoint <= global_blockRanges[i].endCodepoint
        ) {
            return global_blockRanges[i].blockName;
        }
    }
    return `No_Block`;
}

function getSyllableTypeForCodepoint(codepoint: number): string {
    for (let i = 0; i < global_syllableRanges.length; ++i) {
        if (
            codepoint >= global_syllableRanges[i].s &&
            codepoint <= global_syllableRanges[i].e
        ) {
            return global_syllableRanges[i].v;
        }
    }
    return `Not_Applicable`;
}

function getShortJamoName(codepoint: number): string {
    return global_shortJamoNames[codepoint];
}

function getScriptForCodepoint(codepoint: number): string {
    for (let i = 0; i < global_scriptRanges.length; ++i) {
        if (
            codepoint >= global_scriptRanges[i].s &&
            codepoint <= global_scriptRanges[i].e
        ) {
            return global_scriptRanges[i].v;
        }
    }
    return `Unknown`;
}
