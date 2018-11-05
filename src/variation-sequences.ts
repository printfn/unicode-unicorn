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

function variationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	for (let i = 0; i < global_variationSequences.length; ++i) {
		if (global_variationSequences[i].baseCodepoint == codepoint)
			results.push(global_variationSequences[i]);
	}
	return results;
}

function ideographicVariationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	for (let i = 0; i < global_ideographicVariationSequences.length; ++i) {
		if (global_ideographicVariationSequences[i].baseCodepoint == codepoint)
			results.push(global_ideographicVariationSequences[i]);
	}
	return results;
}