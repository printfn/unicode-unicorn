function variationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_variationSequences.length; ++i) {
        if (global_variationSequences[i].baseCodepoint == codepoint)
            results.push(global_variationSequences[i]);
    }
    return results;
}
function ideographicVariationSequencesForCodepoint(codepoint) {
    const results = [];
    for (let i = 0; i < global_ideographicVariationSequences.length; ++i) {
        if (global_ideographicVariationSequences[i].baseCodepoint == codepoint)
            results.push(global_ideographicVariationSequences[i]);
    }
    return results;
}
