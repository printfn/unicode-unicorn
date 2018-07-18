let global_blockRanges: { startCodepoint: number; endCodepoint: number; blockName: string; }[] = [];
let global_syllableRanges: { startCodepoint: number; endCodepoint: number; syllableType: string; }[] = [];
let global_shortJamoNames: { [codepoint: number]: string; } = [];
let global_scriptRanges: { startCodepoint: number; endCodepoint: number; scriptName: string; }[] = [];

function initBlockData(completion: () => void) {
	requestAsync(`data/Unicode/UCD/Blocks.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		const startCodepoint = parseInt(splitLine[0].split(`..`)[0], 16);
		const endCodepoint = parseInt(splitLine[0].split(`..`)[1], 16);
		const blockName = splitLine[1].trim();
		global_blockRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, blockName: blockName});
	}, function() {
        let html = ``;
        for (let i = 0; i < global_blockRanges.length; ++i) {
            const b = global_blockRanges[i];
			html += `<option data-block="${b.blockName}">` + 
			`${b.blockName} (from U+${itos(b.startCodepoint, 16, 4)} to U+${itos(b.endCodepoint, 16, 4)})</option>`;
        }
        updateSelectOptions(`.all-blocks`, html);
        completion();
    });
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

function initHangulSyllableTypes(completion: () => void) {
	requestAsync(`data/Unicode/UCD/HangulSyllableType.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		let startCodepoint: number, endCodepoint: number;
		if (splitLine[0].trim().split(`..`).length == 2) {
			startCodepoint = parseInt(splitLine[0].trim().split(`..`)[0], 16);
			endCodepoint = parseInt(splitLine[0].trim().split(`..`)[1], 16);
		} else {
			startCodepoint = parseInt(splitLine[0].trim(), 16);
			endCodepoint = startCodepoint;
		}
		const syllableType = splitLine[1].trim();
		global_syllableRanges.push({
			startCodepoint: startCodepoint,
			endCodepoint: endCodepoint,
			syllableType: syllableType
		});
	}, completion);
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

function initShortJamoNames(completion: () => void) {
	requestAsync(`data/Unicode/UCD/Jamo.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		const codepoint = parseInt(splitLine[0].trim(), 16);
		const shortJamoName = splitLine[1].trim();
		global_shortJamoNames[codepoint] = shortJamoName;
	}, completion);
}

function getShortJamoName(codepoint: number): string {
	return global_shortJamoNames[codepoint];
}

function initScriptData(completion: () => void) {
	requestAsync(`data/Unicode/UCD/Scripts.txt`, undefined, function(line) {
		const splitLine = line.split(`;`);
		let startCodepoint: number, endCodepoint: number;
		if (splitLine[0].trim().split(`..`).length == 2) {
			startCodepoint = parseInt(splitLine[0].trim().split(`..`)[0], 16);
			endCodepoint = parseInt(splitLine[0].trim().split(`..`)[1], 16);
		} else {
			startCodepoint = parseInt(splitLine[0].trim(), 16);
			endCodepoint = startCodepoint;
		}
		const scriptName = splitLine[1].trim();
		global_scriptRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, scriptName: scriptName});
	}, completion);
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
