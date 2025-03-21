export type CompiledData = {
	global_all_assigned_ranges: {
		startCodepoint: number;
		endCodepoint: number;
	}[];
	global_aliases: {
		codepoint: number;
		alias: string;
		type: string;
	}[];

	global_han_meanings: { [codepoint: number]: string };
	global_mandarin_readings: { [codepoint: number]: string };
	global_kun_readings: { [codepoint: number]: string };
	global_on_readings: { [codepoint: number]: string };
	global_encodingNames: string[];
	global_encodingData: { name: string; type: string }[];
	global_variationSequences: VariationSequence[];
	global_ideographicVariationCollections: VariationCollection[];
	global_blockRanges: {
		startCodepoint: number;
		endCodepoint: number;
		blockName: string;
	}[];
	global_allLanguageTags: { [type: string]: { code: string; name: string }[] };
	global_commonLanguageTags: { [type: string]: { code: string; name: string }[] };
};

export interface VariationSequence {
	baseCodepoint: number;
	variationSelector: number; // codepoint
	description?: string;
	shapingEnvironments?: string[];
}

export interface VariationCollection {
	name: string;
	url: string;
}
