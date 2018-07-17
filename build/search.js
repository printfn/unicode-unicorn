let global_search_strings = [];
function getSearchString(codepoint) {
    let res = ctos([codepoint]) +
        '|U+' + itos(codepoint, 16, 4) +
        '|cp:' + codepoint +
        '|name:' + getName(codepoint, true) +
        '|script:' + getScriptForCodepoint(codepoint).replace(/_/g, ' ') +
        '|category:' + getCharacterCategoryName(codepoint);
    for (let i = 0; i < global_aliases.length; ++i) {
        if (global_aliases[i].codepoint == codepoint) {
            res += '|name:' + global_aliases[i].alias;
        }
    }
    if (global_han_meanings[codepoint])
        res += global_han_meanings[codepoint];
    if (global_kun_readings[codepoint])
        res += '|kun:' + global_kun_readings[codepoint].split(', ').join('|kun:');
    if (global_on_readings[codepoint])
        res += '|on:' + global_on_readings[codepoint].split(', ').join('|on:');
    if (global_mandarin_readings[codepoint])
        res += '|mandarin:' + global_mandarin_readings[codepoint].split(', ').join('|mandarin:');
    return res.toUpperCase();
}
function initializeSearchStrings() {
    for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
        const range = global_all_assigned_ranges[i];
        const end = range.endCodepoint;
        for (let c = range.startCodepoint; c <= end; ++c) {
            global_search_strings[c] = getSearchString(c);
        }
    }
}
function testSearch(searchString, words) {
    if (!searchString.includes(words[0]))
        return false;
    for (let i = 1; i < words.length; ++i) {
        if (!searchString.includes(words[i]))
            return false;
    }
    return true;
}
function searchCodepoints(str) {
    const results = [];
    str = str.toUpperCase();
    const words = str.split(',');
    for (let i = 0; i < words.length; ++i) {
        words[i] = words[i].trim();
    }
    const selectedElements = $('#searchBlock option:selected');
    const blocks = [];
    for (let i = 0; i < selectedElements.length; ++i) {
        const block = selectedElements[i].getAttribute('data-block');
        if (block) {
            blocks.push(block);
        }
    }
    for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
        const range = global_all_assigned_ranges[i];
        const end = range.endCodepoint;
        for (let c = range.startCodepoint; c <= end; ++c) {
            if (blocks.length > 0 && blocks.indexOf(getBlockForCodepoint(c)) == -1)
                continue;
            const searchString = global_search_strings[c];
            if (!searchString)
                continue;
            if (testSearch(searchString, words)) {
                results.push(c);
                if (results.length >= 256)
                    return results;
            }
        }
    }
    return results;
}
