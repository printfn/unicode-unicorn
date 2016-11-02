function jQueryModal(sel, operation) {
    $(sel).modal(operation);
}
var global_useInternalString = false;
var global_internalString = '';
function stringSplice(str, index, count, add) {
    // We cannot pass negative indexes dirrectly to the 2nd slicing operation.
    if (index < 0) {
        index = str.length + index;
        if (index < 0) {
            index = 0;
        }
    }
    return str.slice(0, index) + (add || '') + str.slice(index + count);
}
function getStr() {
    return global_useInternalString ? global_internalString : $('#output').val();
}
function setStr(str) {
    for (var i = 0; i < str.length; ++i) {
        if (str.charCodeAt(i) < 0 || str.charCodeAt(i) > 0x10FFFF) {
            str = stringSplice(str, i, 1); // remove element at i
        }
    }
    global_internalString = str;
    $('#output').val(str);
}
function output(codepoint) {
    setStr(getStr() + ctos([codepoint]));
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
    setStr(getStr().normalize(form));
    updateInfo();
}
function uiState() {
    return $('#output').val()
        + global_internalString
        + $('#encodedInput').val()
        + $('#languageCode').val()
        + $('#useInternalString').is(':checked')
        + $('#outputEncoding option:selected').text()
        + $('#outputFormat option:selected').text()
        + $('#outputJoiner option:selected').text()
        + $('#byteOrderMark option:selected').text()
        + $('#codepageEncoding option:selected').text()
        + $('#languageList option:selected').text()
        + $('#scriptList option:selected').text()
        + $('#regionList option:selected').text()
        + $('#variantList option:selected').text();
}
var global_prevUIState = '';
function updateInfo() {
    if (uiState() == global_prevUIState)
        return;
    actualUpdateInfo();
    global_prevUIState = uiState();
}
function actualUpdateInfo() {
    global_useInternalString = $('#useInternalString').is(':checked');
    setStr(getStr());
    var input = getStr();
    var codepoints = stoc(input);
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
    var encodingLengthsStr = '<thead><tr><th>Encoding</th><th>Number of code units</th><th>Number of bytes</th></tr></thead><tbody>';
    for (var name in global_encodings) {
        var encoding = global_encodings[name];
        var codeUnits = encoding.encode(codepoints);
        if (typeof codeUnits === 'number') {
            var codeUnitsCount = '<span style="color:red">Unable to encode U+' + itos(codeUnits, 16, 4) + '</span>';
            var bytesCount = codeUnitsCount;
        }
        else {
            var codeUnitsCount = codeUnits.length + ' code units';
            var bytesCount = codeUnits.length * hexadecimalPaddingFromEncoding(name) / 2 + ' bytes';
        }
        encodingLengthsStr += '<tr>';
        encodingLengthsStr += '<td>' + name + '</td><td>' + codeUnitsCount + '</td><td>' + bytesCount + '</td>';
        encodingLengthsStr += '</tr>';
    }
    $('#encodingLengths').html(encodingLengthsStr + '</tbody>');
    $('#string').html(escapeHtml(getStr()).replace(/\n/g, '<br>'));
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
    var input = getStr();
    var codepoints = stoc(input);
    codepoints.splice(index, 1);
    var output = ctos(codepoints);
    setStr(output);
    updateInfo();
}
function moveUp(codepoint, index) {
    var input = getStr();
    var codepoints = stoc(input);
    var c = codepoints[index];
    codepoints[index] = codepoints[index - 1];
    codepoints[index - 1] = c;
    var output = ctos(codepoints);
    setStr(output);
    updateInfo();
}
function moveDown(codepoint, index) {
    var input = getStr();
    var codepoints = stoc(input);
    var c = codepoints[index];
    codepoints[index] = codepoints[index + 1];
    codepoints[index + 1] = c;
    var output = ctos(codepoints);
    setStr(output);
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
                    setStr(ctos(arg[1].split(',')));
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
        $('#input').on('keyup', function (e) {
            if (e.keyCode == 13) {
                var input = $('#input').val();
                if (isNaN(parseInt(input.replace('U+', '0x')))) {
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
        $('#output').on('keyup', function () {
            updateInfo();
        });
        $('select').change(function () {
            updateInfo();
        });
        setInterval(function () {
            updateInfo();
            updateSpacerHeights();
        }, 1000);
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            updateSpacerHeights();
            actualUpdateInfo();
        });
        jQueryModal('#loadingModal', 'hide');
        console.log('Loaded in ' + loadDuration + 'ms');
    });
});
