function variationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_variationSequences.length; ++i) {
        if (global_variationSequences[i].baseCodepoint == codepoint)
            results.push(global_variationSequences[i]);
    }
    return results;
}
function urlForIdeographicCollection(name) {
    for (let i = 0; i < global_ideographicVariationCollections.length; ++i) {
        const collection = global_ideographicVariationCollections[i];
        if (collection.name != name)
            continue;
        return collection.url;
    }
}
function ideographicVariationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_ideographicVariationSequences.length; ++i) {
        if (global_ideographicVariationSequences[i].b == codepoint) {
            var ivs = global_ideographicVariationSequences[i];
            results.push({
                baseCodepoint: ivs.b,
                variationSelector: ivs.v,
                description: `ideographic (entry ${ivs.i} in collection <a target="_blank" href="${urlForIdeographicCollection(ivs.c)}">${ivs.c}</a>)`
            });
        }
    }
    return results;
}
