function jQueryModal(sel, operation) {
    $(sel).modal(operation);
}
var global_useInternalString = false;
var global_internalString = [];
function getStr() {
    return global_useInternalString ? global_internalString : stoc($('#output').val());
}
function setStr(str) {
    global_internalString = str;
    $('#output').val(ctos(str));
}
function output(codepoint) {
    setStr(getStr().concat([codepoint]));
    updateInfo();
}
function updateSuggestions() {
    var input = $('#input').val();
    var results = searchCodepoints(input);
    renderCodepointsInTable(results, 'searchResults', [{ displayName: 'Insert', functionName: 'output' }]);
}
function normalizeString(form) {
    if (!String.prototype.normalize) {
        alert('Your browser currently does not support string normalization.');
        return;
    }
    setStr(stoc(ctos(getStr()).normalize(form)));
    updateInfo();
}
function updateInfo() {
    global_useInternalString = $('#useInternalString').is(':checked');
    setStr(getStr());
    var codepoints = getStr();
    if ($('#mojibake').hasClass('active')) {
        var mojibakeOutputs = [];
        $('#outputEncoding option').each(function (i, e) {
            var encoding1Name = $(e).text();
            if (global_encodings[encoding1Name].type == 'text function')
                return;
            var encodedString = encodeOutput('Don\'t use a byte order mark', encoding1Name, 'Decimal', 'Separated using commas and spaces', codepoints);
            if (encodedString.startsWith('<'))
                return;
            $('#outputEncoding option').each(function (j, f) {
                if (i == j)
                    return;
                var encoding2Name = $(f).text();
                if (global_encodings[encoding2Name].type == 'text function')
                    return;
                var decodedString = decodeOutput('Don\'t use a byte order mark', encoding2Name, 'Decimal', 'Separated using commas and spaces', encodedString);
                if (!decodedString)
                    return;
                for (var k = 0; k < mojibakeOutputs.length; ++k) {
                    if (mojibakeOutputs[k].text == ctos(decodedString))
                        return;
                }
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
    updateRenderedCodepage();
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
    var bomCodepoints = [0xFEFF];
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
            var bomCodeUnits = encoding.encode(bomCodepoints);
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
    var url = location.href.indexOf('?') == -1
        ? location.href
        : location.href.substring(0, location.href.indexOf('?'));
    if (codepoints.length > 0)
        url += '?c=' + codepoints.join(',');
    history.replaceState({}, '', url);
    $('#encodedOutput').html(encodeOutput($('#byteOrderMark option:selected').text(), $('#outputEncoding option:selected').text(), $('#outputFormat option:selected').text(), $('#outputJoiner option:selected').text(), codepoints));
    var decodedOutput = decodeOutput($('#byteOrderMark option:selected').text(), $('#outputEncoding option:selected').text(), $('#outputFormat option:selected').text(), $('#outputJoiner option:selected').text(), $('#encodedInput').val());
    if (decodedOutput)
        renderCodepointsInTable(decodedOutput, 'decodedCodepoints', [{ displayName: 'Insert', functionName: 'output' }]);
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
function deleteAtIndex(codepoint, index) {
    var codepoints = getStr();
    codepoints.splice(index, 1);
    setStr(codepoints);
    updateInfo();
}
function moveUp(codepoint, index) {
    var codepoints = getStr();
    var c = codepoints[index];
    codepoints[index] = codepoints[index - 1];
    codepoints[index - 1] = c;
    setStr(codepoints);
    updateInfo();
}
function moveDown(codepoint, index) {
    var codepoints = getStr();
    var c = codepoints[index];
    codepoints[index] = codepoints[index + 1];
    codepoints[index + 1] = c;
    setStr(codepoints);
    updateInfo();
}
function initData(completion) {
    loadUnicodeData(function () {
        callMultipleAsync([
            initializeMappings,
            initHanData,
            initGraphemeData,
            initUnicodeData,
            initGeneralCategoryNames,
            initAliasData,
            initBlockData,
            initHangulSyllableTypes,
            initShortJamoNames,
            initScriptData,
            initLicenseInfo,
            initLanguageData,
            initVariationSequences,
            initIdeographicVariationSequences], function () {
            deleteUnicodeData();
            completion();
        });
    });
}
function updateSpacerHeights() {
    $('.fixed').each(function (i, e) {
        var spacerId = $(e).attr('data-spacer-id');
        var spacer = $('#' + spacerId);
        if (spacer.attr('data-extra-height'))
            var extraHeight = parseFloat($(spacer).attr('data-extra-height'));
        else
            var extraHeight = 0;
        spacer.height($(e).height() + extraHeight);
    });
}
var loaded = false;
jQueryModal('#loadingModal', 'show');
$(document).ready(function () {
    if (loaded)
        return;
    loaded = true;
    updateSpacerHeights();
    var startTime = new Date();
    initData(function () {
        initializeSearchStrings();
        window.onpopstate = function () {
            var args = location.search.substring(1).split('&');
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i].split('=');
                if (arg[0] == 'c') {
                    setStr(arg[1].split(',').map(function (str) { return parseInt(str); }));
                }
                else if (arg[0] == 'info') {
                    showCodepageDetail(parseInt(arg[1]));
                }
            }
        };
        window.onpopstate(null);
        var loadDuration = new Date() - startTime; // in ms
        updateInfo();
        updateSuggestions();
        $('#input').on('input', function (e) {
            if (e.keyCode == 13) {
                var input = $('#input').val();
                if (isNaN(parseInt(input.replace('U+', ''), 16))) {
                    document.body.style.backgroundColor = '#fdd';
                    setTimeout(function () {
                        document.body.style.backgroundColor = '#fff';
                    }, 1000);
                }
                else {
                    output(parseInt(input.replace('U+', '0x')));
                    updateInfo();
                    $('#input').val('');
                }
            }
            updateSuggestions();
        });
        $('#output').on('input', function () {
            updateInfo();
        });
        $('select').change(function () {
            updateInfo();
        });
        setInterval(function () {
            updateSpacerHeights();
        }, 1000);
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            updateSpacerHeights();
            updateInfo();
        });
        jQueryModal('#loadingModal', 'hide');
        console.log('Loaded in ' + loadDuration + 'ms');
    });
});
