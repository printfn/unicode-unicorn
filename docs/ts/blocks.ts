function initBlockData(completion: () => void) {
    for (let i = 0; i < global_blockRanges.length; ++i) {
        const b = global_blockRanges[i];
    }
    completion();
}

function getBlockForCodepoint(codepoint: number): string {
	for (let i = 0; i < global_blockRanges.length; ++i) {
		if (codepoint >= global_blockRanges[i].startCodepoint &&
			codepoint <= global_blockRanges[i].endCodepoint) {
			return global_blockRanges[i].blockName;
		}
	}
	return `No_Block`;
}

function getSyllableTypeForCodepoint(codepoint: number): string {
	for (let i = 0; i < global_syllableRanges.length; ++i) {
		if (codepoint >= global_syllableRanges[i].startCodepoint &&
			codepoint <= global_syllableRanges[i].endCodepoint) {
			return global_syllableRanges[i].syllableType;
		}
	}
	return `Not_Applicable`;
}

function getShortJamoName(codepoint: number): string {
	return global_shortJamoNames[codepoint];
}

function getScriptForCodepoint(codepoint: number): string {
	for (let i = 0; i < global_scriptRanges.length; ++i) {
		if (codepoint >= global_scriptRanges[i].startCodepoint &&
			codepoint <= global_scriptRanges[i].endCodepoint) {
			return global_scriptRanges[i].scriptName;
		}
	}
	return `Unknown`;
}
