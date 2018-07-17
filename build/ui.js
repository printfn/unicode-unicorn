var global_colorMap = {
    'C': '#f97e77',
    'L': '#f9e776',
    'N': '#b7f976',
    'P': '#76f9ee',
    'S': '#7680f9',
    'Z': '#a8a8a8',
};
function renderCodepointsInTable(codepoints, tableId, buttons) {
    var table = $('#' + tableId);
    if (codepoints.length === 0) {
        table.html('');
        return;
    }
    var html = ('<thead>' +
        '<tr><th></th><th>Codepoint (Hex)</th><th>Codepoint (Decimal)</th><th>Character</th><th>Category</th><th>Name</th></tr>' +
        '</thead><tbody>');
    for (var i = 0; i < codepoints.length; ++i) {
        var codepoint = codepoints[i];
        var buttonStr = '';
        for (var j in buttons) {
            var buttonDescription = buttons[j];
            var disabled = '';
            if (buttonDescription.require) {
                if (!buttonDescription.require(i, codepoints.length)) {
                    disabled = 'disabled ';
                }
            }
            buttonStr += '<input type="button" ' + disabled + 'onclick="' + buttonDescription.functionName + '(' + codepoint + ', ' + i + ')" value="' +
                buttonDescription.displayName +
                '">';
        }
        html += '<tr>' +
            '<td>' + buttonStr + '</td>' +
            '<td>U+' + itos(codepoint, 16, 4) + '</td>' +
            '<td>' + codepoint + '</td>' +
            '<td>' + displayCodepoint(codepoint) + '</td>' +
            '<td>' + getCharacterCategoryName(codepoint) + '</td>' +
            '<td style="cursor: pointer;" onclick="showCodepageDetail(' + codepoint + ')">' + getHtmlNameDescription(codepoint) + '</td>' +
            '</tr>';
    }
    if (i >= 256) {
        html += '<tr><td colspan="6">Showing only the first 256 rows.</td></tr>';
    }
    html += '</tbody>';
    table.hide();
    table.html(html);
    table.show();
}
function randomColorForKey(key) {
    if (global_colorMap[key])
        return global_colorMap[key];
    var color = randomColor({
        luminosity: 'light'
    });
    global_colorMap[key] = color;
    return color;
}
function updateRenderedCodepage() {
    var encodingName = $('#codepageEncoding option:selected').text();
    var encoding = global_encodings[encodingName];
    var isAscii = encoding.type == '7-bit mapping';
    var html = '<thead><th></th>';
    for (let i = 0; i < 16; ++i)
        html += '<th>_' + i.toString(16).toUpperCase() + '</th>';
    html += '</thead><tbody>';
    for (let i = 0; i < (isAscii ? 8 : 16); ++i) {
        html += '<tr><td style="font-weight:bold">' + i.toString(16).toUpperCase() + '_</td>';
        for (var j = 0; j < 16; ++j) {
            var byte = (i << 4) + j;
            var codepoints = encoding.decode([byte]);
            if (codepoints) {
                var codepoint = codepoints[0];
                var color = randomColorForKey(getCharacterCategoryCode(codepoint)[0]);
                var displayedCodepoint = displayCodepoint(codepoint);
                html += '<td style="cursor: pointer; background-color: ' + color + ';" onclick="showCodepageDetail(' + codepoint + ')">' +
                    i.toString(16).toUpperCase() +
                    j.toString(16).toUpperCase() +
                    '<br>' +
                    displayedCodepoint +
                    '</td>';
            }
            else {
                html += '<td style="background-color: white">' + i.toString(16).toUpperCase() + j.toString(16).toUpperCase() + '<br>&nbsp;</td>';
            }
        }
        html += '</tr>';
    }
    html += '</tbody>';
    $('#codepage').html(html);
}
function showCodepageDetail(codepoint) {
    $('#detail-codepoint-hex').text(itos(codepoint, 16, 4));
    $('#detail-codepoint-decimal').text(codepoint);
    $('#detail-name').html('"' + getName(codepoint) + '"');
    $('#detail-character').html(displayCodepoint(codepoint));
    $('#detail-character-raw').text(ctos([codepoint]));
    $('#detail-character-textbox').val(ctos([codepoint]));
    $('#detail-category').text(getCharacterCategoryCode(codepoint) + ' (' + getCharacterCategoryName(codepoint) + ')');
    $('#detail-block').text(getBlockForCodepoint(codepoint).replace(/_/g, ' '));
    $('#detail-script').text(getScriptForCodepoint(codepoint).replace(/_/g, ' '));
    var matchingAliases = [];
    for (let i = 0; i < global_aliases.length; ++i) {
        if (global_aliases[i].codepoint == codepoint)
            matchingAliases.push(global_aliases[i].alias);
    }
    if (matchingAliases.length === 0) {
        $('#detail-aliases').hide();
    }
    else {
        $('#detail-aliases').show();
        $('#detail-aliases-list').text(matchingAliases.join(', '));
    }
    var meaning = global_han_meanings[codepoint];
    if (meaning) {
        $('#detail-meaning').show();
        $('#detail-meaning-content').text(meaning);
    }
    else {
        $('#detail-meaning').hide();
    }
    var mandarin = global_mandarin_readings[codepoint];
    if (mandarin) {
        $('#detail-mandarin').show();
        $('#detail-mandarin-content').text(mandarin);
    }
    else {
        $('#detail-mandarin').hide();
    }
    var kun = global_kun_readings[codepoint];
    if (kun) {
        $('#detail-kun').show();
        $('#detail-kun-content').text(kun);
    }
    else {
        $('#detail-kun').hide();
    }
    var on = global_on_readings[codepoint];
    if (on) {
        $('#detail-on').show();
        $('#detail-on-content').text(on);
    }
    else {
        $('#detail-on').hide();
    }
    var variationSequences = variationSequencesForCodepoint(codepoint).concat(ideographicVariationSequencesForCodepoint(codepoint));
    if (variationSequences.length === 0) {
        $('#detail-variation-sequences').hide();
    }
    else {
        $('#detail-variation-sequences').show();
        var variationsString = '';
        for (let i = 0; i < variationSequences.length; ++i) {
            let vs = variationSequences[i];
            if (variationsString !== '')
                variationsString += '<br>';
            if (!vs.shapingEnvironments)
                vs.shapingEnvironments = [];
            variationsString +=
                'U+' + itos(vs.baseCodepoint, 16, 4) +
                    ' U+' + itos(vs.variationSelector, 16, 4) +
                    ': ' + escapeHtml(ctos([vs.baseCodepoint, vs.variationSelector])) +
                    ' <i>' + vs.description;
            if (vs.shapingEnvironments.length > 0)
                variationsString += ' (' + vs.shapingEnvironments.join(', ') + ')</i>';
            else
                variationsString += '</i>';
        }
        $('#detail-variation-sequences-content').html(variationsString);
    }
    var encodingsString = '';
    $('#outputEncoding option').each(function (i, e) {
        var encoding = $(e).text();
        var html = encodeOutput($('#byteOrderMark option:selected').text(), encoding, $('#outputFormat option:selected').text(), $('#outputJoiner option:selected').text(), [codepoint]);
        if (html.startsWith('<span'))
            return;
        encodingsString += encoding + ': ' + html + '\n';
    });
    $('#detail-encoding-outputs').html(encodingsString);
    $('#detail-previous-cp').attr('data-cp', codepoint != 0 ? itos(codepoint - 1, 10) : itos(0x10FFFF, 10));
    $('#detail-next-cp').attr('data-cp', codepoint != 0x10FFFF ? itos(codepoint + 1, 10) : itos(0, 10));
    jQueryModal('#codepoint-detail', 'show');
}
function changeDetail(elem) {
    $(elem).blur(); // remove focus
    var codepointToShow = parseInt($(elem).attr('data-cp'), 10);
    showCodepageDetail(codepointToShow);
}
function initLicenseInfo(completion) {
    requestAsync('data/licenses.html', function (lines) {
        $('#licenses-text').html(lines.join('\n'));
        completion();
    });
}
function updateMojibake() {
    var codepoints = getStr();
    var mojibakeOutputs = [];
    $('#mojibakeEncodings option').each(function (i, e) {
        if (!e.selected)
            return;
        var encoding1Name = $(e).text();
        if (global_encodings[encoding1Name].type == 'text function')
            return;
        var encodedString = encodeOutput('Don\'t use a byte order mark', encoding1Name, 'Decimal', 'Separated using commas and spaces', codepoints);
        if (encodedString.startsWith('<'))
            return;
        $('#mojibakeEncodings option').each(function (j, f) {
            if (i == j)
                return;
            if (!f.selected)
                return;
            var encoding2Name = $(f).text();
            if (global_encodings[encoding2Name].type == 'text function')
                return;
            var decodedString = decodeOutput('Don\'t use a byte order mark', encoding2Name, 'Decimal', 'Separated using commas and spaces', encodedString);
            if (!decodedString)
                return;
            mojibakeOutputs.push({
                encoding1Name: encoding1Name,
                encoding2Name: encoding2Name,
                text: ctos(decodedString)
            });
        });
    });
    var mojibakeOutputStr = '';
    var lastEncoding1 = '';
    for (var i = 0; i < mojibakeOutputs.length; ++i) {
        var o = mojibakeOutputs[i];
        if (o.encoding1Name != lastEncoding1) {
            lastEncoding1 = o.encoding1Name;
            mojibakeOutputStr += 'Assuming the input was erroneously interpreted as ' + o.encoding1Name + ':<br>';
        }
        mojibakeOutputStr += '    If the original encoding was ' + o.encoding2Name + ':<br>        ' + mojibakeOutputs[i].text + '<br>';
    }
    $('#mojibakeOutput').html(mojibakeOutputStr);
}
function updateEncodedLengths() {
    var codepoints = getStr();
    $('#extendedGraphemeClusters').text(countGraphemesForCodepoints(codepoints, true));
    $('#legacyGraphemeClusters').text(countGraphemesForCodepoints(codepoints, false));
    $('#numCodepoints').text(codepoints.length);
    var encodingLengthsStr = '<thead><tr>' +
        '<th>Encoding</th>' +
        '<th>Number of code units</th>' +
        '<th>Number of bytes</th>' +
        '<th>Number of code units (incl. BOM)</th>' +
        '<th>Number of bytes (incl. BOM)</th>' +
        '</tr></thead><tbody>';
    let bomCodepoints = [0xFEFF];
    for (var i = 0; i < codepoints.length; ++i) {
        bomCodepoints.push(codepoints[i]);
    }
    for (var name in global_encodings) {
        var encoding = global_encodings[name];
        var codeUnits = encoding.encode(codepoints);
        var cellEntries = ['', '', '', ''];
        if (typeof codeUnits === 'number') {
            cellEntries[0] = '<span style="color:red">Unable to encode U+' + itos(codeUnits, 16, 4) + '</span>';
            cellEntries[3] = cellEntries[2] = cellEntries[1] = cellEntries[0];
        }
        else {
            cellEntries[0] = codeUnits.length + ' code units';
            cellEntries[1] = codeUnits.length * hexadecimalPaddingFromEncoding(name) / 2 + ' bytes';
            let bomCodeUnits = encoding.encode(bomCodepoints);
            if (typeof bomCodeUnits === 'number') {
                cellEntries[3] = cellEntries[2] = '<span style="color:red">Unable to encode BOM (U+FEFF)</span>';
            }
            else {
                cellEntries[2] = bomCodeUnits.length + ' code units';
                cellEntries[3] = bomCodeUnits.length * hexadecimalPaddingFromEncoding(name) / 2 + ' bytes';
            }
        }
        encodingLengthsStr += '<tr>';
        encodingLengthsStr += '<td>' + name + '</td><td>' + cellEntries.join('</td><td>') + '</td>';
        encodingLengthsStr += '</tr>';
    }
    $('#encodingLengths').html(encodingLengthsStr + '</tbody>');
    $('#string').html(escapeHtml(ctos(getStr())).replace(/\n/g, '<br>'));
}
function updateCodepointList() {
    var codepoints = getStr();
    renderCodepointsInTable(codepoints, 'codepointlist', [{
            displayName: 'Delete',
            functionName: 'deleteAtIndex'
        }, {
            displayName: 'Move up',
            functionName: 'moveUp',
            require: function (i, length) { return i != 0; }
        }, {
            displayName: 'Move down',
            functionName: 'moveDown',
            require: function (i, length) { return i != length - 1; }
        }]);
}
function updateEncodedAndDecodedStrings() {
    var codepoints = getStr();
    $('#encodedOutput').html(encodeOutput($('#byteOrderMark option:selected').text(), $('#outputEncoding option:selected').text(), $('#outputFormat option:selected').text(), $('#outputJoiner option:selected').text(), codepoints));
    var decodedOutput = decodeOutput($('#byteOrderMark option:selected').text(), $('#outputEncoding option:selected').text(), $('#outputFormat option:selected').text(), $('#outputJoiner option:selected').text(), $('#encodedInput').val());
    if (decodedOutput)
        renderCodepointsInTable(decodedOutput, 'decodedCodepoints', [{ displayName: 'Insert', functionName: 'output' }]);
}
function updateLanguage() {
    var lang = '';
    var textboxCode = $('#languageCode').val();
    var dropdownCode = '';
    var langComponentStrings = [
        $('#languageList option:selected').attr('data-code'),
        $('#scriptList option:selected').attr('data-code'),
        $('#regionList option:selected').attr('data-code'),
        $('#variantList option:selected').attr('data-code')
    ];
    for (var i = 0; i < langComponentStrings.length; ++i) {
        var component = langComponentStrings[i];
        if (!component)
            continue;
        if (dropdownCode != '')
            dropdownCode += '-';
        dropdownCode += component;
    }
    // valid states:
    //   everything enabled, textboxCode and dropdownCode empty
    //   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
    //   dropdownCode empty: dropdown disabled
    if ($('#languageCode')[0].hasAttribute('disabled')) {
        $('#languageCode').val(''); // occurs when dropdownCode is reset to blank
    }
    if (textboxCode == '' && dropdownCode == '') {
        $('#languageCode').removeAttr('disabled');
        $('#languageList').removeAttr('disabled');
        $('#scriptList').removeAttr('disabled');
        $('#regionList').removeAttr('disabled');
        $('#variantList').removeAttr('disabled');
        lang = '';
    }
    else if (textboxCode == '' && dropdownCode != '') {
        $('#languageCode').attr('disabled', 'disabled');
        $('#languageList').removeAttr('disabled');
        $('#scriptList').removeAttr('disabled');
        $('#regionList').removeAttr('disabled');
        $('#variantList').removeAttr('disabled');
        lang = dropdownCode;
        $('#languageCode').val(lang);
    }
    else if (textboxCode != '' && dropdownCode == '') {
        $('#languageCode').removeAttr('disabled');
        $('#languageList').attr('disabled', 'disabled');
        $('#scriptList').attr('disabled', 'disabled');
        $('#regionList').attr('disabled', 'disabled');
        $('#variantList').attr('disabled', 'disabled');
        lang = textboxCode;
    }
    else {
        if ($('#languageCode')[0].hasAttribute('disabled')) {
            lang = dropdownCode;
            $('#languageCode').val(lang);
        }
        else {
            lang = textboxCode;
        }
    }
    $('html').attr('lang', lang);
    $('html').attr('xml:lang', lang);
}
function updateUseInternalString() {
    global_useInternalString = $('#useInternalString').is(':checked');
}
function updateSelectOptions(selector, html) {
    $(selector).html(html);
    $(selector).trigger('chosen:updated');
}
