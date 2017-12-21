var global_graphemeBreakData = [];
function initGraphemeData(completion) {
    requestAsync('data/Unicode/UCD/auxiliary/GraphemeBreakProperty.txt', function () { }, function (line) {
        var state = 1;
        var startCodepoint = '';
        var endCodepoint = '';
        var value = '';
        for (var j = 0; j < line.length; ++j) {
            var c = line[j];
            if (c == '#')
                break;
            if (state == 1) {
                if (c != '.' && c != ' ') {
                    startCodepoint += c;
                    continue;
                }
                else {
                    state = 2;
                }
            }
            if (state == 2) {
                if (c == ' ') {
                    state = 3;
                }
                else if (c == '.') {
                    continue;
                }
                else {
                    endCodepoint += c;
                    continue;
                }
            }
            if (state == 3) {
                if (c == ' ')
                    continue;
                else if (c == ';') {
                    state = 4;
                    continue;
                }
            }
            if (state == 4) {
                if (c == ' ') {
                    continue;
                }
                else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
                    value += c;
                    continue;
                }
                else
                    break;
            }
        }
        startCodepoint = parseInt(startCodepoint, 16);
        endCodepoint = endCodepoint === '' ? startCodepoint : parseInt(endCodepoint, 16);
        for (var x = startCodepoint; x <= endCodepoint; ++x) {
            global_graphemeBreakData[x] = value;
        }
    }, completion);
}
function graphemeBreakValueForCodepoint(codepoint) {
    if (global_graphemeBreakData[codepoint])
        return global_graphemeBreakData[codepoint];
    return 'Other';
}
function countGraphemesForCodepoints(codepoints, useExtended) {
    if (codepoints.length === 0)
        return 0;
    // for GB12 and GB13
    var numberOfContinuousRegionalIndicatorSymbols = 0;
    var value1OfGB10 = false; // true if and only if LHS matches (E_Base | E_Base_GAZ) Extend*
    var breaks = 0;
    for (var i = 1; i < codepoints.length; ++i) {
        // increment `breaks` if we should break between codepoints[i-1] and codepoints[i]
        var value1 = graphemeBreakValueForCodepoint(codepoints[i - 1]);
        var value2 = graphemeBreakValueForCodepoint(codepoints[i]);
        // see http://unicode.org/reports/tr29/#Grapheme_Cluster_Boundary_Rules for descriptions of grapheme cluster boundary rules
        // skip rules GB1 and GB2 as they deal with SOT and EOT and thus don't affect the number of graphemes in a string
        // Nontrivial rules:
        // GB10 LHS: (E_Base | E_Base_GAZ) Extend* × ...
        if (value1 == 'E_Base' || value1 == 'E_Base_GAZ') {
            value1OfGB10 = true;
        }
        else if (value1 == 'Extend' && value1OfGB10 === true) {
        }
        else {
            value1OfGB10 = false;
        }
        // handle value1 of GB12 and GB13
        //   GB12:     ^ (RI RI)* RI × ...
        //   GB13: [^RI] (RI RI)* RI × ...
        // they match if there is an odd number of Regional_Indicator codepoints on the left-hand side
        if (value1 == 'Regional_Indicator') {
            ++numberOfContinuousRegionalIndicatorSymbols;
        }
        else {
            numberOfContinuousRegionalIndicatorSymbols = 0;
        }
        if (value1 == 'CR' && value2 == 'LF') {
        }
        else if (value1 == 'Control' || value1 == 'CR' || value1 == 'LF') {
            ++breaks;
        }
        else if (value2 == 'Control' || value2 == 'CR' || value2 == 'LF') {
            ++breaks;
        }
        else if (value1 == 'L' && (value2 == 'L' || value2 == 'V' || value2 == 'LV' || value2 == 'LVT')) {
        }
        else if ((value1 == 'LV' || value1 == 'V') && (value2 == 'V' || value2 == 'T')) {
        }
        else if ((value1 == 'LVT' || value1 == 'T') && value2 == 'T') {
        }
        else if (value2 == 'Extend' || value2 == 'ZWJ') {
        }
        else if (useExtended && value2 == 'SpacingMark') {
        }
        else if (useExtended && value1 == 'Prepend') {
        }
        else if (value1OfGB10 && value2 == 'E_Modifier') {
        }
        else if (value1 == 'ZWJ' && (value2 == 'Glue_After_Zwj' || value2 == 'E_Base_GAZ')) {
        }
        else if (numberOfContinuousRegionalIndicatorSymbols % 2 == 1 && value2 == 'Regional_Indicator') {
        }
        else {
            ++breaks;
        }
    }
    return breaks + 1;
}
