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
        if (collection.name != name) continue;
        return collection.url;
    }
}

function ideographicVariationSequencesForCodepoint(codepoint: number) {
    const results: VariationSequence[] = [];
    const seqs_from_wasm = JSON.parse(wasm_bindgen.variation_sequences_for_codepoint(codepoint));
    for (let i = 0; i < seqs_from_wasm.length; ++i) {
        var ivs = seqs_from_wasm[i];
        results.push({
            baseCodepoint: ivs.base_codepoint,
            variationSelector: ivs.variation_selector,
            description: `ideographic (entry ${
                ivs.item
            } in collection <a target="_blank" rel="noopener" href="${urlForIdeographicCollection(
                ivs.collection
            )}">${ivs.collection}</a>)`
        });
    }
    return results;
}
