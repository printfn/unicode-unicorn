interface VariationSequence {
	baseCodepoint: number;
	variationSelector: number; // codepoint
	description?: string;
	shapingEnvironments?: string[];
}

interface VariationCollection {
	name: string;
	url: string;
}

var global_variationSequences: VariationSequence[] = [];
var global_ideographicVariationSequences: VariationSequence[] = [];
var global_ideographicVariationCollections: VariationCollection[] = [];

function initVariationSequences(completion: () => void) {
	requestAsync('data/Unicode/UCD/StandardizedVariants.txt', null, function(line) {
		var fields = line.split(';');
		var codepoints = fields[0].split(' ').map((str) => parseInt(str, 16));
		var description = fields[1].trim();
		var shapingEnvironments = fields[2].trim().split(' ');
		if (shapingEnvironments.length == 1 && shapingEnvironments[0] === '')
			shapingEnvironments = [];
		global_variationSequences.push({
			baseCodepoint: codepoints[0],
			variationSelector: codepoints[1],
			description: description,
			shapingEnvironments: shapingEnvironments
		});
	}, completion);
}

function variationSequencesForCodepoint(codepoint: number) {
	var results: VariationSequence[] = [];
	for (var i = 0; i < global_variationSequences.length; ++i) {
		if (global_variationSequences[i].baseCodepoint == codepoint)
			results.push(global_variationSequences[i]);
	}
	return results;
}

function initIdeographicVariationSequences(completion: () => void) {
	requestAsync('data/Unicode/IVD/IVD_Sequences.txt', null, function(line) {
		var fields = line.split(';');
		var codepoints = fields[0].split(' ').map((str) => parseInt(str, 16));
		var collection = fields[1].trim();
		var item = fields[2].trim();
		global_ideographicVariationSequences.push({
			baseCodepoint: codepoints[0],
			variationSelector: codepoints[1],
			description: 'ideographic (entry ' + item + ' in collection <a target="_blank" href="' + urlForIdeographicCollection(collection) + '">' + collection + '</a>)'
		});
	}, completion);
}

function urlForIdeographicCollection(name: string) {
	for (var i = 0; i < global_ideographicVariationCollections.length; ++i) {
		var collection = global_ideographicVariationCollections[i];
		if (collection.name != name)
			continue;
		return collection.url;
	}
}

function initIdeographicVariationCollections(completion: () => void) {
	requestAsync('data/Unicode/IVD/IVD_Collections.txt', null, function(line) {
		var fields = line.split(';');
		global_ideographicVariationCollections.push({
			name: fields[0],
			url: fields[2] // fields[1] is a regex describing item identifiers
		});
	}, completion);
}

function ideographicVariationSequencesForCodepoint(codepoint: number) {
	var results: VariationSequence[] = [];
	for (var i = 0; i < global_ideographicVariationSequences.length; ++i) {
		if (global_ideographicVariationSequences[i].baseCodepoint == codepoint)
			results.push(global_ideographicVariationSequences[i]);
	}
	return results;
}