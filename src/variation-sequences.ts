interface VariationSequence {
	baseCodepoint: number;
	variationSelector: number; // codepoint
	description?: string;
	shapingEnvironments?: string[];
}

interface IdeographicVariationSequence {
	b: number; // base codepoint
	v: number; // variation selector
	c: string; // collection
	i: string; // item, i.e. index into collection
}

interface VariationCollection {
	name: string;
	url: string;
}

function variationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	for (let i = 0; i < global_variationSequences.length; ++i) {
		if (global_variationSequences[i].baseCodepoint == codepoint)
			results.push(global_variationSequences[i]);
	}
	return results;
}

function urlForIdeographicCollection(name: string) {
	for (let i = 0; i < global_ideographicVariationCollections.length; ++i) {
		const collection = global_ideographicVariationCollections[i];
		if (collection.name != name)
			continue;
		return collection.url;
	}
}

function ideographicVariationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	for (let i = 0; i < global_ideographicVariationSequences.length; ++i) {
		if (global_ideographicVariationSequences[i].b == codepoint) {
			var ivs = global_ideographicVariationSequences[i];
			results.push({
				baseCodepoint: ivs.b,
				variationSelector: ivs.v,
				description: `ideographic (entry ${ivs.i} in collection <a target="_blank" rel="noopener" href="${urlForIdeographicCollection(ivs.c)}">${ivs.c}</a>)`
			});
		}
	}
	return results;
}