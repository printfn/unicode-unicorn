function initBlockData(completion) {
	requestAsync('UCD/Blocks.txt', function(lines) {
		window.blockRanges = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0 || lines[i][0] == '#')
				continue;
			var splitLine = lines[i].split(';');
			var startCodepoint = parseInt('0x' + splitLine[0].split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].split('..')[1]);
			var blockName = splitLine[1].trim();
			window.blockRanges.push({startCodepoint: startCodepoint, endCodepoint: endCodepoint, blockName: blockName});
		}
		completion();
	});
}

function getBlockForCodepoint(codepoint) {
	for (var i = 0; i < window.blockRanges.length; ++i) {
		if (codepoint >= window.blockRanges[i].startCodepoint
			&& codepoint <= window.blockRanges[i].endCodepoint) {
			return window.blockRanges[i].blockName;
		}
	}
}

function initHangulSyllableTypes(completion) {
	requestAsync('UCD/HangulSyllableType.txt', function(lines) {
		window.syllableRanges = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0 || lines[i][0] == '#')
				continue;
			var line = lines[i].split('#')[0];
			var splitLine = line.split(';');
			var startCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[0]);
			var endCodepoint = parseInt('0x' + splitLine[0].trim().split('..')[1]);
			var syllableType = splitLine[1].trim();
			window.syllableRanges.push({
				startCodepoint: startCodepoint,
				endCodepoint: endCodepoint,
				syllableType: syllableType
			});
		}
		completion();
	});
}

function getSyllableTypeForCodepoint(codepoint) {
	for (var i = 0; i < window.syllableRanges.length; ++i) {
		if (codepoint >= window.syllableRanges[i].startCodepoint
			&& codepoint <= window.syllableRanges[i].endCodepoint) {
			return window.syllableRanges[i].syllableType;
		}
	}
	return 'Not_Applicable';
}

function initShortJamoNames(completion) {
	requestAsync('UCD/Jamo.txt', function(lines) {
		window.shortJamoNames = [];
		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length == 0 || lines[i][0] == '#')
				continue;
			var line = lines[i].split('#')[0];
			var splitLine = line.split(';');
			var codepoint = parseInt('0x' + splitLine[0].trim());
			var shortJamoName = splitLine[1].trim();
			window.shortJamoNames[codepoint] = shortJamoName;
		}
		completion();
	});
}

function getShortJamoName(codepoint) {
	return window.shortJamoNames[codepoint];
}

