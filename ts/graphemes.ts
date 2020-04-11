function isExtendedPictographic(codepoint: number): boolean {
    for (const i in global_extendedPictograph) {
        if (global_extendedPictograph[i] == codepoint) {
            return true;
        }
    }
    return false;
}

function graphemeBreakValueForCodepoint(codepoint: number): string {
    if (global_graphemeBreakData[codepoint]) return global_graphemeBreakData[codepoint];
    return `Other`;
}

// Updated for revision 37
function countGraphemesForCodepoints(codepoints: number[], type: 'legacy' | 'extended') {
    if (codepoints.length === 0) return 0;

    let useExtended: boolean;
    switch (type) {
        case 'extended':
            useExtended = true;
            break;
        case 'legacy':
            useExtended = false;
            break;
        default:
            throw 'You need to specify whether to use extended or legacy grapheme clusters';
    }

    // for GB12 and GB13
    let numberOfContinuousRegionalIndicatorSymbols = 0;
    let value1OfGB11 = false; // true if and only if LHS matches \p{Extended_Pictographic} Extend*

    let breaks = 0;
    for (let i = 1; i < codepoints.length; ++i) {
        // increment `breaks` if we should break between codepoints[i-1] and codepoints[i]
        const value1 = graphemeBreakValueForCodepoint(codepoints[i - 1]);
        const value2 = graphemeBreakValueForCodepoint(codepoints[i]);

        // see http://unicode.org/reports/tr29/#Grapheme_Cluster_Boundary_Rules for descriptions of grapheme cluster boundary rules
        // skip rules GB1 and GB2 as they deal with SOT and EOT and thus don`t affect the number of graphemes in a string

        // Nontrivial rules:

        // handle value1 of GB12 and GB13
        //   GB12:     ^ (RI RI)* RI × ...
        //   GB13: [^RI] (RI RI)* RI × ...
        // they match if there is an odd number of Regional_Indicator codepoints on the left-hand side
        if (value1 == `Regional_Indicator`) {
            ++numberOfContinuousRegionalIndicatorSymbols;
        } else {
            numberOfContinuousRegionalIndicatorSymbols = 0;
        }

        if (value1 == `CR` && value2 == `LF`) {
            // GB3
        } else if (value1 == `Control` || value1 == `CR` || value1 == `LF`) {
            // GB4
            ++breaks;
        } else if (value2 == `Control` || value2 == `CR` || value2 == `LF`) {
            // GB5
            ++breaks;
        } else if (
            value1 == `L` &&
            (value2 == `L` || value2 == `V` || value2 == `LV` || value2 == `LVT`)
        ) {
            // GB6
        } else if ((value1 == `LV` || value1 == `V`) && (value2 == `V` || value2 == `T`)) {
            // GB7
        } else if ((value1 == `LVT` || value1 == `T`) && value2 == `T`) {
            // GB8
        } else if (value2 == `Extend` || value2 == `ZWJ`) {
            // GB9
        } else if (useExtended && value2 == `SpacingMark`) {
            // GB9a
        } else if (useExtended && value1 == `Prepend`) {
            // GB9b
        } else if (value1OfGB11 && value1 == `ZWJ` && isExtendedPictographic(codepoints[i])) {
            // GB11
        } else if (
            numberOfContinuousRegionalIndicatorSymbols % 2 == 1 &&
            value2 == `Regional_Indicator`
        ) {
            // GB12 and GB13
        } else {
            // GB999
            ++breaks;
        }

        // GB10 LHS: (E_Base | E_Base_GAZ) Extend* × ...
        if (isExtendedPictographic(codepoints[i - 1])) {
            value1OfGB11 = true;
        } else if (value1 == `Extend` && value1OfGB11 === true) {
            // do nothing
        } else {
            value1OfGB11 = false;
        }
    }
    return breaks + 1;
}
