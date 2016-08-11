global_variationSequences = [];

function initVariationSequences(completion) {
	requestAsync('data/Unicode/UCD/StandardizedVariants.txt', null, function(line) {
		var fields = line.split(';');
		var codepoints = fields[0].split(' ');
		codepoints[0] = parseInt(codepoints[0], 16);
		codepoints[1] = parseInt(codepoints[1], 16);
		var description = fields[1].trim();
		var shapingEnvironments = fields[2].trim().split(' ');
		if (shapingEnvironments.length == 1 && shapingEnvironments[0] == '')
			shapingEnvironments = [];
		global_variationSequences.push({
			base: codepoints[0],
			variationSelector: codepoints[1],
			description: description,
			shapingEnvironments: shapingEnvironments
		});
	}, completion);
}

function variationSequencesForCodepoint(codepoint) {
	var results = [];
	for (var i = 0; i < global_variationSequences.length; ++i) {
		if (global_variationSequences[i].base == codepoint)
			results.push(global_variationSequences[i]);
	}
	return results;
}