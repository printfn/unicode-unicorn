var global_variationSequences = [];
var global_ideographicVariationSequences = [];
function initVariationSequences(completion) {
    requestAsync('data/Unicode/UCD/StandardizedVariants.txt', null, function (line) {
        var fields = line.split(';');
        var codepoints = fields[0].split(' ').map(function (str) { return parseInt(str, 16); });
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
function variationSequencesForCodepoint(codepoint) {
    var results = [];
    for (var i = 0; i < global_variationSequences.length; ++i) {
        if (global_variationSequences[i].baseCodepoint == codepoint)
            results.push(global_variationSequences[i]);
    }
    return results;
}
function initIdeographicVariationSequences(completion) {
    requestAsync('data/Unicode/IVD/IVD_Sequences.txt', null, function (line) {
        var fields = line.split(';');
        var codepoints = fields[0].split(' ').map(function (str) { return parseInt(str, 16); });
        global_ideographicVariationSequences.push({
            baseCodepoint: codepoints[0],
            variationSelector: codepoints[1]
        });
    }, completion);
}
function ideographicVariationSequencesForCodepoint(codepoint) {
    var results = [];
    for (var i = 0; i < global_ideographicVariationSequences.length; ++i) {
        if (global_ideographicVariationSequences[i].baseCodepoint == codepoint)
            results.push(global_ideographicVariationSequences[i]);
    }
    return results;
}
