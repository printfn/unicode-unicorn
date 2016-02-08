function initBlockData(completion) {
	requestAsync('UCD/Blocks.txt', function() {
		blockRanges = [];
	}, function(line) {
		var splitLine = line.split(';');
		var startCodepoint = parseInt('0x' + splitLine[0].split('..')[0]);
		var endCodepoint = parseInt('0x' + splitLine[0].split('..')[1]);
		var blockName = splitLine[1].trim();
		blockRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, blockName: blockName});
	}, completion);
}

function getBlockForCodepoint(codepoint) {
	for (var i = 0; i < blockRanges.length; ++i) {
		if (codepoint >= blockRanges[i].startCodepoint
			&& codepoint <= blockRanges[i].endCodepoint) {
			return blockRanges[i].blockName;
		}
	}
	return 'No_Block';
}

function initHangulSyllableTypes(completion) {
	requestAsync('UCD/HangulSyllableType.txt', function() {
		syllableRanges = [];
	}, function(line) {
		var splitLine = line.split(';');
		if (splitLine[0].trim().split('..').length == 2) {
			var startCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[1]);
		} else {
			var startCodepoint = parseInt('0x' + splitLine[0].trim());
			var endCodepoint = startCodepoint;
		}
		var syllableType = splitLine[1].trim();
		syllableRanges.push({
			startCodepoint: startCodepoint,
			endCodepoint: endCodepoint,
			syllableType: syllableType
		});
	}, completion);
}

function getSyllableTypeForCodepoint(codepoint) {
	for (var i = 0; i < syllableRanges.length; ++i) {
		if (codepoint >= syllableRanges[i].startCodepoint
			&& codepoint <= syllableRanges[i].endCodepoint) {
			return syllableRanges[i].syllableType;
		}
	}
	return 'Not_Applicable';
}

function initShortJamoNames(completion) {
	requestAsync('UCD/Jamo.txt', function() {
		shortJamoNames = [];
	}, function(line) {
		var splitLine = line.split(';');
		var codepoint = parseInt('0x' + splitLine[0].trim());
		var shortJamoName = splitLine[1].trim();
		shortJamoNames[codepoint] = shortJamoName;
	}, completion);
}

function getShortJamoName(codepoint) {
	return shortJamoNames[codepoint];
}

function initScriptData(completion) {
	requestAsync('UCD/Scripts.txt', function() {
		scriptRanges = [];
	}, function(line) {
		var splitLine = line.split(';');
		if (splitLine[0].trim().split('..').length == 2) {
			var startCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[1]);
		} else {
			var startCodepoint = parseInt('0x' + splitLine[0].trim());
			var endCodepoint = startCodepoint;
		}
		var scriptName = splitLine[1].trim();
		scriptRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, scriptName: scriptName});
	}, completion);
}

function getScriptForCodepoint(codepoint) {
	for (var i = 0; i < scriptRanges.length; ++i) {
		if (codepoint >= scriptRanges[i].startCodepoint
			&& codepoint <= scriptRanges[i].endCodepoint) {
			return scriptRanges[i].scriptName;
		}
	}
	return 'Unknown';
}
