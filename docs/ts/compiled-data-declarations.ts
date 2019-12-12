declare var global_data: { [codepoint: number]: string; }
declare var global_ranges: { startCodepoint: number; endCodepoint: number; rangeName: string }[]
declare var global_all_assigned_ranges: { startCodepoint: number; endCodepoint: number; rangeName: string }[]
declare var global_category: { [codepoint: number]: string; }
declare var global_categoryRanges: { startCodepoint: number; endCodepoint: number; categoryCode: string }[]
declare var global_generalCategoryNames: { [categoryCode: string]: string; }
declare var global_aliases: { codepoint: number; alias: string; type: string; }[]
declare var global_han_meanings: { [codepoint: number]: string; }
declare var global_mandarin_readings: { [codepoint: number]: string; }
declare var global_kun_readings: { [codepoint: number]: string; }
declare var global_on_readings: { [codepoint: number]: string; }
declare var global_variationSequences: VariationSequence[]
declare var global_ideographicVariationSequences: IdeographicVariationSequence[]
declare var global_ideographicVariationCollections: VariationCollection[]
declare var global_encodingNames: string[]
declare var global_encodingData: { name: string, type: string, data: string }[]
declare var global_graphemeBreakData: { [codepoint: number]: string; }
declare var global_extendedPictograph: number[]
declare var global_blockRanges: { startCodepoint: number; endCodepoint: number; blockName: string; }[]
declare var global_syllableRanges: { s: number; e: number; v: string; }[]
declare var global_shortJamoNames: { [codepoint: number]: string; }
declare var global_scriptRanges: { s: number; e: number; v: string; }[]
declare var global_allLanguageTagsHTML: { [key: string]: string; }
declare var global_commonLanguageTagsHTML: { [key: string]: string; }
