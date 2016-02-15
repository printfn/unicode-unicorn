global_blockRanges = [];
global_syllableRanges = [];
global_shortJamoNames = [];
global_scriptRanges = [];

function initBlockData(completion) {
	requestAsync('UCD/Blocks.txt', null, function(line) {
		var splitLine = line.split(';');
		var startCodepoint = parseInt('0x' + splitLine[0].split('..')[0]);
		var endCodepoint = parseInt('0x' + splitLine[0].split('..')[1]);
		var blockName = splitLine[1].trim();
		global_blockRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, blockName: blockName});
	}, completion);
}

function getBlockForCodepoint(codepoint) {
	for (var i = 0; i < global_blockRanges.length; ++i) {
		if (codepoint >= global_blockRanges[i].startCodepoint
			&& codepoint <= global_blockRanges[i].endCodepoint) {
			return global_blockRanges[i].blockName;
		}
	}
	return 'No_Block';
}

function initHangulSyllableTypes(completion) {
	requestAsync('UCD/HangulSyllableType.txt', null, function(line) {
		var splitLine = line.split(';');
		if (splitLine[0].trim().split('..').length == 2) {
			var startCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[1]);
		} else {
			var startCodepoint = parseInt('0x' + splitLine[0].trim());
			var endCodepoint = startCodepoint;
		}
		var syllableType = splitLine[1].trim();
		global_syllableRanges.push({
			startCodepoint: startCodepoint,
			endCodepoint: endCodepoint,
			syllableType: syllableType
		});
	}, completion);
}

function getSyllableTypeForCodepoint(codepoint) {
	for (var i = 0; i < global_syllableRanges.length; ++i) {
		if (codepoint >= global_syllableRanges[i].startCodepoint
			&& codepoint <= global_syllableRanges[i].endCodepoint) {
			return global_syllableRanges[i].syllableType;
		}
	}
	return 'Not_Applicable';
}

function initShortJamoNames(completion) {
	requestAsync('UCD/Jamo.txt', null, function(line) {
		var splitLine = line.split(';');
		var codepoint = parseInt('0x' + splitLine[0].trim());
		var shortJamoName = splitLine[1].trim();
		global_shortJamoNames[codepoint] = shortJamoName;
	}, completion);
}

function getShortJamoName(codepoint) {
	return global_shortJamoNames[codepoint];
}

function initScriptData(completion) {
	requestAsync('UCD/Scripts.txt', null, function(line) {
		var splitLine = line.split(';');
		if (splitLine[0].trim().split('..').length == 2) {
			var startCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[1]);
		} else {
			var startCodepoint = parseInt('0x' + splitLine[0].trim());
			var endCodepoint = startCodepoint;
		}
		var scriptName = splitLine[1].trim();
		global_scriptRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, scriptName: scriptName});
	}, completion);
}

function getScriptForCodepoint(codepoint) {
	for (var i = 0; i < global_scriptRanges.length; ++i) {
		if (codepoint >= global_scriptRanges[i].startCodepoint
			&& codepoint <= global_scriptRanges[i].endCodepoint) {
			return global_scriptRanges[i].scriptName;
		}
	}
	return 'Unknown';
}
