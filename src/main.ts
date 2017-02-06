interface ModalJQuery {
	modal(operation: string): void;
}
function jQueryModal(sel: string, operation: string) {
	(<ModalJQuery> <any> $(sel)).modal(operation);
}

var global_useInternalString = false;
var global_internalString: number[] = [];

interface TextListener {
	tabId?: string,
	elementId: string,
	f: () => void
}
var global_event_listeners: TextListener[] = [{
	tabId: 'settings',
	elementId: 'output',
	f: updateUseInternalString
}, {
	tabId: 'mojibake',
	elementId: 'output',
	f: updateMojibake
}, {
	tabId: 'codepages',
	elementId: 'output',
	f: updateRenderedCodepage
}, {
	tabId: 'stats',
	elementId: 'output',
	f: updateEncodedLengths
}, {
	tabId: 'codepoints',
	elementId: 'output',
	f: updateCodepointList
}, {
	tabId: 'encode',
	elementId: 'output',
	f: updateEncodedAndDecodedStrings
}, {
	tabId: 'settings',
	elementId: 'output',
	f: updateLanguage
}];

function callEventListenersForElemId(elemId: string) {
	for (var i = 0; i < global_event_listeners.length; ++i) {
		var listener = global_event_listeners[i];
		if (listener.elementId != elemId)
			continue;
		if (listener.tabId) {
			if (!$('#' + listener.tabId).hasClass('active'))
				continue;
		}
		listener.f();
	}
}

function getStr() {
	return global_useInternalString ? global_internalString : stoc($('#output').val());
}

function setStr(str: number[]) {
	global_internalString = str;
	$('#output').val(ctos(str));
}

function output(codepoint: number) {
	setStr(getStr().concat([codepoint]));
	updateInfo();
}

function updateSuggestions() {
	var input = $('#input').val();
	var results = searchCodepoints(input);
	renderCodepointsInTable(
		results,
		'searchResults',
		[{displayName: 'Insert', functionName: 'output'}]
	);
}

function normalizeString(form: string) {
	if (!String.prototype.normalize) {
		alert('Your browser currently does not support string normalization.');
		return;
	}

	setStr(stoc(ctos(getStr()).normalize(form)));
	updateInfo();
}

function updateInfo() {
	var codepoints = getStr();
	setStr(codepoints);

	callEventListenersForElemId('output');

	var url = location.href.indexOf('?') == -1
		? location.href
		: location.href.substring(0, location.href.indexOf('?'));
	if (codepoints.length > 0)
		url += '?c=' + codepoints.join(',');
	history.replaceState({}, '', url);
}

function deleteAtIndex(codepoint: number, index: number) {
	var codepoints = getStr();
	codepoints.splice(index, 1);
	setStr(codepoints);
	updateInfo();
}

function moveUp(codepoint: number, index: number) {
	var codepoints = getStr();
	var c = codepoints[index];
	codepoints[index] = codepoints[index-1];
	codepoints[index-1] = c;
	setStr(codepoints);
	updateInfo();
}

function moveDown(codepoint: number, index: number) {
	var codepoints = getStr();
	var c = codepoints[index];
	codepoints[index] = codepoints[index+1];
	codepoints[index+1] = c;
	setStr(codepoints);
	updateInfo();
}

function initData(completion: () => void) {
	loadUnicodeData(function() {
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
			initIdeographicVariationSequences,
			initIdeographicVariationCollections], function() {
				deleteUnicodeData();
				completion();
			});
	});
}

function updateSpacerHeights() {
	$('.fixed').each(function(i, e) {
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
$(document).ready(function() {
	if (loaded)
		return;
	loaded = true;
	(<any> $('select')).chosen({ disable_search_threshold: 10, width: '100%' });
	updateSpacerHeights();
	var startTime = new Date();
	initData(function() {
		initializeSearchStrings();
		window.onpopstate = function() {
			var args = location.search.substring(1).split('&');
			for (var i = 0; i < args.length; ++i) {
				var arg = args[i].split('=');
				if (arg[0] == 'c') {
					setStr(arg[1].split(',').map((str) => parseInt(str)));
				} else if (arg[0] == 'info') {
					showCodepageDetail(parseInt(arg[1]));
				}
			}
		};
		window.onpopstate(null);
		var loadDuration = <any> new Date() - <any> startTime; // in ms
		updateInfo();
		updateSuggestions();
		$('#input').on('keyup', function(e) {
			if (e.keyCode == 13) {
				var input = $('#input').val();
				if (isNaN(parseInt(input.replace('U+', ''), 16))) {
					document.body.style.backgroundColor = '#fdd';
					setTimeout(function() {
						document.body.style.backgroundColor = '#fff';
					}, 1000);
				} else {
					output(parseInt(input.replace('U+', ''), 16));
					$('#input').val('');
				}
			}
		});
		$('#input').on('input', function(e) {
			updateSuggestions();
		});
		$('#searchBlock').on('change', function(e) {
			updateSuggestions();
		});
		$('#output, #encodedInput').on('input', function() {
			updateInfo();
		});
		$('select').on('change', function() {
			updateInfo();
		});
		setInterval(function() {
			updateSpacerHeights();
		}, 1000);
		$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
			updateSpacerHeights();
			callEventListenersForElemId('output');
		});
		jQueryModal('#loadingModal', 'hide');
		console.log('Loaded in ' + loadDuration + 'ms');
	});
});