import './style.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { CompiledData, VariationCollection, VariationSequence } from '../data/data-types';
import { Modal, Tab } from 'bootstrap';

import Chosen from './chosen/chosen';

async function initBlockData() {
	for (let i = 0; i < global_blockRanges.length; ++i) {
		const b = global_blockRanges[i];
	}
}

function getBlockForCodepoint(codepoint: number): string {
	for (let i = 0; i < global_blockRanges.length; ++i) {
		if (
			codepoint >= global_blockRanges[i].startCodepoint &&
			codepoint <= global_blockRanges[i].endCodepoint
		) {
			return global_blockRanges[i].blockName;
		}
	}
	return 'No_Block';
}

function getSyllableTypeForCodepoint(codepoint: number): string {
	for (let i = 0; i < global_syllableRanges.length; ++i) {
		if (codepoint >= global_syllableRanges[i].s && codepoint <= global_syllableRanges[i].e) {
			return global_syllableRanges[i].v;
		}
	}
	return 'Not_Applicable';
}

function getShortJamoName(codepoint: number): string {
	return global_shortJamoNames[codepoint];
}

var global_data: { [codepoint: number]: string };
var global_ranges: {
	startCodepoint: number;
	endCodepoint: number;
	rangeName: string;
}[];
var global_all_assigned_ranges: {
	startCodepoint: number;
	endCodepoint: number;
}[];
var global_aliases: {
	codepoint: number;
	alias: string;
	type: string;
}[];
var global_han_meanings: { [codepoint: number]: string };
var global_mandarin_readings: { [codepoint: number]: string };
var global_kun_readings: { [codepoint: number]: string };
var global_on_readings: { [codepoint: number]: string };
var global_variationSequences: VariationSequence[];
var global_ideographicVariationCollections: VariationCollection[];
var global_encodingNames: string[];
var global_encodingData: { name: string; type: string }[];
var global_blockRanges: {
	startCodepoint: number;
	endCodepoint: number;
	blockName: string;
}[];
var global_syllableRanges: { s: number; e: number; v: string }[];
var global_shortJamoNames: { [codepoint: number]: string };
var global_allLanguageTags: { [type: string]: { code: string; name: string }[] };
var global_commonLanguageTags: { [type: string]: { code: string; name: string }[] };

function getCharacterCategoryName(codepoint: number): string | undefined {
	const categoryCode = wasm.get_character_category_code(codepoint);
	const name: string | undefined = wasm.long_category_name_for_short_name(categoryCode);
	return name;
}

function getCharacterBasicType(codepoint: number): string | undefined {
	const basicType: string | undefined = wasm.basic_type_for_codepoint(codepoint);
	return basicType;
}


function decompomposeHangulSyllable(codepoint: number): number[] {
	const syllableType = getSyllableTypeForCodepoint(codepoint);
	if (syllableType == 'Not_Applicable') return [codepoint];

	// see Unicode Standard, section 3.12 "Conjoining Jamo Behavior", "Hangul Syllable Decomposition"
	const SBase = 0xac00;
	const LBase = 0x1100;
	const VBase = 0x1161;
	const TBase = 0x11a7;
	const LCount = 19;
	const VCount = 21;
	const TCount = 28;
	const NCount = VCount * TCount; // 588
	const SCount = LCount * NCount; // 11172

	const SIndex = codepoint - SBase;

	const LIndex = Math.floor(SIndex / NCount);
	const VIndex = Math.floor((SIndex % NCount) / TCount);
	const TIndex = SIndex % TCount;

	const LPart = LBase + LIndex;
	const VPart = VBase + VIndex;
	if (TIndex > 0) {
		return [LPart, VPart, TBase + TIndex];
	} else {
		return [LPart, VPart];
	}
}

function getName(codepoint: number, search: boolean = false): string {
	let d = global_data[codepoint];
	if (d) {
		if (d[0] != '<') return d;
		else return '';
	}
	if (0xac00 <= codepoint && codepoint <= 0xd7af) {
		const decomposedSyllables = decompomposeHangulSyllable(codepoint);
		const shortJamoNames: string[] = [];
		for (let i = 0; i < decomposedSyllables.length; ++i)
			shortJamoNames.push(getShortJamoName(decomposedSyllables[i]));
		return `HANGUL SYLLABLE ${shortJamoNames.join('')}`;
	}
	if (
		(0x3400 <= codepoint && codepoint <= 0x4dbf) ||
		(0x4e00 <= codepoint && codepoint <= 0x9fff)
	) {
		if (search) return 'CJK UNIFIED IDEOGRAPH';
		return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
	}
	for (let i = 0; i < global_ranges.length; ++i) {
		const range = global_ranges[i];
		if (codepoint >= range.startCodepoint && codepoint <= range.endCodepoint) {
			if (range.rangeName.startsWith('CJK Ideograph')) {
				if (search) return 'CJK UNIFIED IDEOGRAPH';
				return `CJK UNIFIED IDEOGRAPH-${itos(codepoint, 16, 4)}`;
			}
		}
	}
	return '';
}

function getHtmlNameDescription(codepoint: number): string {
	if (getName(codepoint) !== '') return getName(codepoint);
	if (global_data[codepoint] == '<control>') {
		const name: string[] = [];
		for (let i = 0; i < global_aliases.length; ++i) {
			if (global_aliases[i].codepoint == codepoint) {
				if (global_aliases[i].type != 'control' && name.length > 0) break;
				name.push(global_aliases[i].alias);
				if (global_aliases[i].type != 'control') break;
			}
		}
		if (name.length > 0) return `<i>${name.join(' / ')}</i>`;
	}
	return `<i>Unknown-${itos(codepoint, 16, 4)}</i>`;
}

function validDigitsForFormat(format: string) {
	let validDigitChars: string[] = [
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
	];
	let numDigits = numberForFormat(format);
	if (numDigits < 16) {
		validDigitChars = validDigitChars.slice(0, numberForFormat(format));
	}
	// for hex, always allow upper-case and lower-case letters
	return validDigitChars;
}

function splitByFormatDigits(str: string, format: string) {
	let validDigitChars = validDigitsForFormat(format);
	let strings: string[] = [];
	let currentStr = '';
	for (let i = 0; i < str.length; ++i) {
		if (validDigitChars.indexOf(str[i]) != -1) {
			currentStr += str[i];
		} else {
			if (currentStr != '') {
				strings.push(currentStr);
				currentStr = '';
			}
		}
	}
	if (currentStr != '') {
		strings.push(currentStr);
		currentStr = '';
	}
	return strings;
}

function decodeOutput(byteOrderMark: string, encoding: string, format: string, str: string) {
	if (!str) return;
	let strings = splitByFormatDigits(str, format);
	const codeUnits = textToBytes(format, strings);
	for (let i = 0; i < codeUnits.length; ++i) if (isNaN(codeUnits[i])) return;
	const codepoints = codeUnitsToCodepoints(encoding, codeUnits);
	if (!codepoints) return;
	const useBOM = byteOrderMark.startsWith('Use');
	if (useBOM) {
		codepoints.unshift(1);
	}
	return codepoints;
}
function encodeOutput(
	byteOrderMark: string,
	encoding: string,
	format: string,
	codepoints: number[],
) {
	const useBOM = byteOrderMark.startsWith('Use');
	if (useBOM) {
		codepoints.unshift(0xfeff);
	}
	let bytes;
	try {
		bytes = codepointsToEncoding(encoding, codepoints);
	} catch {
		bytes = undefined;
	}
	// TODO: bytes should never be undefined if encodings (specifically utf-8/16) are written properly
	if (typeof bytes == 'number' || !bytes) {
		// input contains codepoints incompatible with the selected encoding
		const invalidCodepoint = bytes || 0;
		return `<span style="color: red">Text cannot be encoded in ${encoding} because it contains incompatible characters.\nThe first such incompatible character is U+${itos(
			invalidCodepoint,
			16,
			4,
		)} - ${getHtmlNameDescription(invalidCodepoint)} (${displayCodepoint(
			invalidCodepoint,
		)}).</span>`;
	} else if (typeof bytes == 'string') {
		const outputString = bytes;
		return escapeHtml(outputString);
	}
	let minLength = parseInt(
		(document.getElementById('minCodeUnitLength')! as HTMLInputElement).value,
		10,
	);
	if (minLength == 0) {
		let bytesPerCodeUnit = 1;
		// set minLength automatically based on code unit size and base (hex, binary, etc.)
		if (encoding.includes('32-bit code units')) {
			bytesPerCodeUnit = 4;
		} else if (encoding.includes('16-bit code units')) {
			bytesPerCodeUnit = 2;
		}
		if (format == 'Binary') {
			minLength = bytesPerCodeUnit * 8; // 8, 16, or 32
		} else if (format == 'Octal') {
			minLength = bytesPerCodeUnit * 3; // 3, 6, or 12
		} else if (format == 'Decimal') {
			minLength = 0;
		} else if (format == 'Hexadecimal (uppercase)' || format == 'Hexadecimal (lowercase)') {
			minLength = bytesPerCodeUnit * 2; // 2, 4 or 8
		}
	}
	const chars = bytesToText(format, bytes, minLength);
	let grouping = parseInt(
		(document.getElementById('groupingCount')! as HTMLInputElement).value,
		10,
	);
	if (grouping == 0) grouping = 1;
	let groups: string[] = [];
	for (let i = 0; i < chars.length; ++i) {
		if (i % grouping == 0) {
			groups.push(chars[i]);
		} else {
			groups[groups.length - 1] += chars[i];
		}
	}
	const groupPrefix = (document.getElementById('groupPrefix')! as HTMLInputElement).value || '';
	const groupSuffix = (document.getElementById('groupSuffix')! as HTMLInputElement).value || '';
	for (let i = 0; i < groups.length; ++i) {
		groups[i] = groupPrefix + groups[i] + groupSuffix;
	}
	const groupSeparator =
		(document.getElementById('outputJoinerText')! as HTMLTextAreaElement).value || '';
	return escapeHtml(groups.join(groupSeparator));
}
interface Encoding {
	type: string;
	encode?: (codepoints: number[]) => number[] | number;
	decode?: (codeUnits: number[]) => number[];
}

let global_encodings: { [encodingName: string]: Encoding } = {};

function escapeHtml(unsafeString: string): string {
	return unsafeString
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function ctos(codepoints: number[]): string {
	return wasm.ctos(new Uint32Array(codepoints)) as string;
}

function stoc(string: string): number[] {
	return Array.from(wasm.stoc(string));
}

function nextCodepoint(codepoint: number): number {
	return wasm.next_codepoint(codepoint);
}

function previousCodepoint(codepoint: number): number {
	return wasm.previous_codepoint(codepoint);
}

function ctou8(codepoints: Uint32Array): Uint8Array | undefined {
	return wasm.ctou8(codepoints);
}

function u8toc(bytes: Uint8Array): Uint32Array | undefined {
	return wasm.u8toc(bytes);
}

function itos(int: number, base: number, padding: number = 0) {
	let res = int.toString(base).toUpperCase();
	while (res.length < padding) {
		res = '0' + res;
	}
	return res;
}

async function initializeMappings() {
	for (let i in global_encodingData) {
		let encodingData = global_encodingData[i];
		loadEncodingFromData(encodingData.type, encodingData.name);
	}
	let codepageOptions: Node[] = [];
	let outputEncodingOptions: Node[] = [];
	let mojibakeOptions: Node[] = [];
	global_encodingNames.forEach((encodingName) => {
		if (
			global_encodings[encodingName].type == '7-bit wasm' ||
			global_encodings[encodingName].type == '8-bit wasm'
		) {
			const option = document.createElement('option');
			option.selected = encodingName == 'ISO-8859-1 (Latin-1 Western European)';
			option.innerText = encodingName;
			codepageOptions.push(option);
		}
		const outputEncodingOption = document.createElement('option');
		outputEncodingOption.innerText = encodingName;
		outputEncodingOptions.push(outputEncodingOption);
		const mojibakeOption = document.createElement('option');
		mojibakeOption.innerText = encodingName;
		mojibakeOptions.push(mojibakeOption);
	});
	updateSelectOptions('codepageEncoding', codepageOptions);
	updateSelectOptions('outputEncoding', outputEncodingOptions);
	updateSelectOptions('mojibakeEncodings', mojibakeOptions);
}

function loadEncodingFromData(type: string, name: string) {
	let encoding: Encoding = {
		type: type,
		encode: undefined,
		decode: undefined,
	};
	if (type == '7-bit wasm' || type == '8-bit wasm' || type == 'other wasm') {
		encoding.encode = function (codepoints) {
			let res = JSON.parse(wasm.encode_str(name, new Uint32Array(codepoints)));
			if (res.success) {
				return res.encoded_code_units;
			} else {
				return res.first_invalid_codepoint;
			}
		};
		encoding.decode = function (bytes) {
			return Array.from(wasm.decode_str(name, new Uint32Array(bytes)) || []);
		};
	} else {
		throw new Error(`Unknown encoding type: ${type}`);
	}
	global_encodings[name] = encoding;
}

function codepointsToEncoding(encoding: string, codepoints: number[]) {
	return global_encodings[encoding].encode!(codepoints);
}

function codeUnitsToCodepoints(encoding: string, codeUnits: number[]): number[] {
	return global_encodings[encoding].decode!(codeUnits);
}

function bytesToText(format: string, bytes: number[], minLength?: number) {
	const chars: string[] = [];
	if (typeof minLength === 'undefined') minLength = 0;
	for (let i = 0; i < bytes.length; ++i) {
		const b = bytes[i];
		let str = numberToStringWithFormat(b, format);
		while (str.length < minLength) str = '0' + str;
		str = ((document.getElementById('codeUnitPrefix')! as HTMLInputElement).value || '') + str;
		str = str + ((document.getElementById('codeUnitSuffix')! as HTMLInputElement).value || '');
		chars.push(str);
	}
	return chars;
}

function textToBytes(format: string, strings: string[]) {
	const bytes: number[] = [];
	for (let i = 0; i < strings.length; ++i) {
		const str = strings[i];
		bytes.push(parseIntWithFormat(str, format));
	}
	return bytes;
}
function numberForFormat(format: string) {
	switch (format) {
		case 'Binary':
			return 2;
		case 'Octal':
			return 8;
		case 'Decimal':
			return 10;
		case 'Hexadecimal (uppercase)':
			return 16;
		case 'Hexadecimal (lowercase)':
			return 16;
		default:
			throw new Error(`Invalid format: ${format}`);
	}
}

function numberToStringWithFormat(n: number, format: string) {
	let str = n.toString(numberForFormat(format));
	if (format == 'Hexadecimal (uppercase)') str = str.toUpperCase();
	return str;
}

function parseIntWithFormat(str: string, format: string) {
	return parseInt(str, numberForFormat(format));
}

function countGraphemesForCodepoints(codepoints: number[]) {
	if (codepoints.length === 0) return 0;
	return wasm.count_graphemes(ctos(codepoints));
}
function initLanguageData() {
	let showRareLanguagesButton = document.getElementById('showRareLanguages')!;
	const showAllLanguages = showRareLanguagesButton.hasAttribute('disabled');
	const tagsToNodes = function (languageTags: { code: string; name: string }[]) {
		let nodes: Node[] = [];
		const defaultOption = document.createElement('option');
		defaultOption.dataset.code = '';
		defaultOption.innerText = 'None / Default';
		nodes.push(defaultOption);
		for (const tag of languageTags) {
			const option = document.createElement('option');
			option.dataset.code = tag.code;
			option.innerText = `${tag.name} (${tag.code})`;
			nodes.push(option);
		}
		return nodes;
	};
	const languageTags = showAllLanguages ? global_allLanguageTags : global_commonLanguageTags;
	updateSelectOptions('languageList', tagsToNodes(languageTags['language']));
	updateSelectOptions('scriptList', tagsToNodes(languageTags['script']));
	updateSelectOptions('regionList', tagsToNodes(languageTags['region']));
	updateSelectOptions('variantList', tagsToNodes(languageTags['variant']));
	showRareLanguagesButton.addEventListener('click', () => {
		showRareLanguagesButton.setAttribute('disabled', 'disabled');
		initLanguageData();
	});
}

let global_useInternalString = false;
let global_internalString: number[] = [];

interface TextListener {
	tabId?: string;
	elementId: string;
	f: () => void;
}
let global_event_listeners: TextListener[] = [
	{
		tabId: 'settings',
		elementId: 'output',
		f: updateUseInternalString,
	},
	{
		tabId: 'mojibake',
		elementId: 'output',
		f: updateMojibake,
	},
	{
		tabId: 'codepages',
		elementId: 'output',
		f: updateRenderedCodepage,
	},
	{
		tabId: 'stats',
		elementId: 'output',
		f: updateEncodedLengths,
	},
	{
		tabId: 'codepoints',
		elementId: 'output',
		f: updateCodepointList,
	},
	{
		tabId: 'encode',
		elementId: 'output',
		f: updateEncodedAndDecodedStrings,
	},
	{
		tabId: 'settings',
		elementId: 'output',
		f: updateLanguage,
	},
];

function callEventListenersForElemId(elemId: string) {
	for (let i = 0; i < global_event_listeners.length; ++i) {
		const listener = global_event_listeners[i];
		if (listener.elementId != elemId) continue;
		if (listener.tabId) {
			if (!getElementById(listener.tabId).classList.contains('active')) continue;
		}
		listener.f();
	}
}

function getStr() {
	if (global_useInternalString) {
		return global_internalString;
	} else {
		return stoc((getElementById('output') as HTMLInputElement).value);
	}
}

function setStr(str: number[]) {
	global_internalString = str;
	(getElementById('output') as HTMLInputElement).value = ctos(str);
}

function output(codepoint: number) {
	setStr(getStr().concat([codepoint]));
	updateInfo();
}
(window as any).output = output;

function updateSuggestions() {
	const input = (getElementById('input') as HTMLInputElement).value;
	const results = searchCodepoints(input);
	renderCodepointsInTable(results, 'searchResults', [
		{ displayName: 'Insert', functionName: 'output', require: () => true },
	]);
}

function normalizeString(form: string) {
	setStr(stoc(ctos(getStr()).normalize(form)));
	updateInfo();
}
(window as any).normalizeString = normalizeString;

function updateInfo() {
	const codepoints = getStr();
	setStr(codepoints);

	callEventListenersForElemId('output');

	let url =
		location.href.indexOf('?') == -1
			? location.href
			: location.href.substring(0, location.href.indexOf('?'));
	if (codepoints.length > 0) {
		url += `?c=${codepoints.join(',')}`;
	}
	history.replaceState({}, '', url);
}

function deleteAtIndex(codepoint: number, index: number) {
	const codepoints = getStr();
	codepoints.splice(index, 1);
	setStr(codepoints);
	updateInfo();
}
(window as any).deleteAtIndex = deleteAtIndex;

function moveUp(codepoint: number, index: number) {
	const codepoints = getStr();
	const c = codepoints[index];
	codepoints[index] = codepoints[index - 1];
	codepoints[index - 1] = c;
	setStr(codepoints);
	updateInfo();
}
(window as any).moveUp = moveUp;

function moveDown(codepoint: number, index: number) {
	const codepoints = getStr();
	const c = codepoints[index];
	codepoints[index] = codepoints[index + 1];
	codepoints[index + 1] = c;
	setStr(codepoints);
	updateInfo();
}
(window as any).moveDown = moveDown;

function initGlobalVariables(data: CompiledData) {
	global_data = data['global_data'];
	global_ranges = data['global_ranges'];
	global_all_assigned_ranges = data['global_all_assigned_ranges'];
	global_aliases = data['global_aliases'];
	global_han_meanings = data['global_han_meanings'];
	global_mandarin_readings = data['global_mandarin_readings'];
	global_kun_readings = data['global_kun_readings'];
	global_on_readings = data['global_on_readings'];
	global_variationSequences = data['global_variationSequences'];
	global_ideographicVariationCollections = data['global_ideographicVariationCollections'];
	global_encodingNames = data['global_encodingNames'];
	global_encodingData = data['global_encodingData'];
	global_blockRanges = data['global_blockRanges'];
	global_syllableRanges = data['global_syllableRanges'];
	global_shortJamoNames = data['global_shortJamoNames'];
	global_allLanguageTags = data['global_allLanguageTags'];
	global_commonLanguageTags = data['global_commonLanguageTags'];
}

let wasm: typeof import('../wasm/pkg');

async function initWasm() {
	wasm = await import('../wasm/pkg');
	await wasm.default();
	wasm.init_panic_hook();
}

async function initData() {
	const compiledData = await import('../data/compiled-data.json');
	initGlobalVariables(compiledData as any);
	await Promise.all([initializeMappings(), initBlockData(), initLanguageData(), initWasm()]);
}

function ready(fn: () => void) {
	if (document.readyState != 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}
ready(async function () {
	const selects = document.getElementsByTagName('select');
	for (const select of selects) {
		new Chosen(select, { disable_search_threshold: 10, width: '100%' });
	}
	initBindings();
	const startTime = new Date();
	await initData();
	console.log(new Date().getTime() - startTime.getTime()); // in ms
	initializeSearchStrings();
	console.log(new Date().getTime() - startTime.getTime()); // in ms
	window.onpopstate = function () {
		const args = location.search.substring(1).split('&');
		for (let i = 0; i < args.length; ++i) {
			const arg = args[i].split('=');
			if (arg[0] == 'c') {
				setStr(arg[1].split(',').map((str) => parseInt(str)));
			} else if (arg[0] == 'info') {
				showCodepageDetail(parseInt(arg[1]));
			} else if (arg[0] == 'str') {
				// search queries via the omnibox are URL-escaped (with UTF-8 encoding),
				// and spaces are converted to '+'.
				setStr(stoc(decodeURIComponent(arg[1].replace(/\+/g, ' '))));
			}
		}
	};
	window.onpopstate(new PopStateEvent(''));
	const loadDuration = new Date().getTime() - startTime.getTime(); // in ms
	updateInfo();
	updateSuggestions();
	getElementById('input').addEventListener('keyup', function (e) {
		if (e.keyCode == 13) {
			const input = (getElementById('input') as HTMLInputElement).value;
			if (isNaN(parseInt(input.replace('U+', ''), 16))) {
				document.body.style.backgroundColor = '#fdd';
				setTimeout(function () {
					document.body.style.backgroundColor = '#fff';
				}, 1000);
			} else {
				output(parseInt(input.replace('U+', ''), 16));
				(getElementById('input') as HTMLInputElement).value = '';
			}
		}
	});
	getElementById('input').addEventListener('input', function (e) {
		updateSuggestions();
	});
	for (let id of [
		'output',
		'encodedInput',
		'minCodeUnitLength',
		'codeUnitPrefix',
		'codeUnitSuffix',
		'groupingCount',
		'groupPrefix',
		'groupSuffix',
		'outputJoinerText',
	]) {
		let elem = getElementById(id);
		elem.addEventListener('input', () => updateInfo());
	}
	for (const select of selects) {
		select.addEventListener('change', () => {
			updateInfo();
		});
	}
	// document.addEventListener(
	//     'change',
	//     function (e) {
	//         for (
	//             let target = e.target;
	//             target && target != this && target instanceof HTMLElement;
	//             target = target.parentNode
	//         ) {
	//             if (target.matches('select')) {
	//                 updateInfo();
	//                 break;
	//             }
	//         }
	//     },
	//     false
	// );
	var tabEl = document.querySelectorAll('a[data-bs-toggle="tab"]');
	for (let tab of tabEl) {
		tab.addEventListener('shown.bs.tab', function (event) {
			console.log(event);
			callEventListenersForElemId('output');
		});
	}
	// This should be on 'input' instead, but this doesn't fire on
	//  Safari. See https://caniuse.com/#feat=input-event (#4)
	//  and specifically https://bugs.webkit.org/show_bug.cgi?id=149398
	getElementById('useInternalString').addEventListener('change', function (e) {
		updateUseInternalString();
	});
	getElementById('languageCode').addEventListener('input', function (e) {
		updateLanguage();
	});
	console.log(`Loaded in ${loadDuration}ms`);
});
let global_search_strings: { [codepoint: number]: string } = [];

function getTermsForSearchString(
	array: { [codepoint: number]: string },
	codepoint: number,
	prefix: string,
) {
	let entry = array[codepoint];
	if (!entry) {
		return '';
	}

	return `${prefix}${entry.split(', ').join(prefix)}`;
}

function getAliasSearchStringForCodepoint(codepoint: number) {
	let res = '';

	for (let i = 0; i < global_aliases.length; ++i) {
		if (global_aliases[i].codepoint == codepoint) {
			res += `|name:${global_aliases[i].alias}`;
		}
	}

	return res;
}

function getSearchString(codepoint: number) {
	let res = `${ctos([codepoint])}|U+${itos(codepoint, 16, 4)}|cp:${codepoint}|name:${getName(
		codepoint,
		true,
	)}|block:${getBlockForCodepoint(codepoint)}|script:${wasm.get_script(codepoint).replace(
		/_/g,
		' ',
	)}|category:${getCharacterCategoryName(codepoint)}`;

	res += getAliasSearchStringForCodepoint(codepoint);

	if (global_han_meanings[codepoint]) {
		res += global_han_meanings[codepoint];
	}

	res += getTermsForSearchString(global_kun_readings, codepoint, '|kun:');
	res += getTermsForSearchString(global_on_readings, codepoint, '|on:');
	res += getTermsForSearchString(global_mandarin_readings, codepoint, '|mandarin:');

	return res.toUpperCase();
}

function initializeSearchStrings() {
	for (const range of global_all_assigned_ranges) {
		const end = range.endCodepoint;
		for (let c = range.startCodepoint; c <= end; ++c) {
			global_search_strings[c] = getSearchString(c);
		}
	}
}

function testSearch(searchString: string, words: string[]) {
	if (!searchString.includes(words[0])) return false;
	for (let i = 1; i < words.length; ++i) {
		if (!searchString.includes(words[i])) return false;
	}
	return true;
}

function wordsFromSearchExpression(str: string) {
	str = str.toUpperCase();
	const words = str.split(',');
	for (let i = 0; i < words.length; ++i) {
		words[i] = words[i].trim();
	}
	return words;
}

function searchCodepoints(str: string) {
	const results: number[] = [];

	const words = wordsFromSearchExpression(str);

	for (let i = 0; i < global_all_assigned_ranges.length; ++i) {
		const range = global_all_assigned_ranges[i];
		const end = range.endCodepoint;
		for (let c = range.startCodepoint; c <= end; ++c) {
			const searchString = global_search_strings[c];
			if (!searchString) {
				continue;
			}

			if (testSearch(searchString, words)) {
				results.push(c);
				if (results.length >= 256) {
					return results;
				}
			}
		}
	}

	return results;
}
function assert(expr: boolean, message: string) {
	if (!expr) throw new Error(message);
}

function assertEqual(actual: any, expected: any, otherInfo?: string) {
	if (otherInfo) {
		otherInfo = `: ${otherInfo}`;
	} else {
		otherInfo = '';
	}
	if (actual != expected)
		throw new Error(`Expected ${actual} to be equal to ${expected}${otherInfo}`);
}

function assertEqualArrays(actual: any[], expected: any[], otherInfo?: string) {
	if (actual.length == expected.length) {
		for (let i = 0; i < actual.length; ++i) {
			if (actual[i] != expected[i]) {
				return `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
			}
		}
		return true;
	}
	throw new Error(`Expected ${actual} to be equal to ${expected}: ${otherInfo}`);
}

function testBlocks() {
	for (let cp = 0; cp < 0x300; ++cp) {
		const block = getBlockForCodepoint(cp);
		if (cp <= 0x7f) assertEqual(block, 'Basic Latin', `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0xff)
			assertEqual(block, 'Latin-1 Supplement', `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x17f)
			assertEqual(block, 'Latin Extended-A', `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x24f)
			assertEqual(block, 'Latin Extended-B', `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x2af) assertEqual(block, 'IPA Extensions', `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x2ff)
			assertEqual(block, 'Spacing Modifier Letters', `Codepoint ${itos(cp, 16, 4)}`);
	}
}

function testGraphemeCount() {
	assertEqual(
		countGraphemesForCodepoints([128104, 8205, 10084, 65039, 8205, 128104]),
		1,
	);
	assertEqual(
		countGraphemesForCodepoints(
			[
				128104, 8205, 10084, 65039, 8205, 128104, 128104, 8205, 10084, 65039, 8205, 128104,
				128104, 8205, 10084, 65039, 8205, 128104,
			],
		),
		3,
	);
	assertEqual(
		countGraphemesForCodepoints(
			[127464, 127467, 127470, 127464, 127463, 127481, 127464],
		),
		4,
	);
}

function testAsciiQuotes() {
	assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x60]), [8216]);
	assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x80]), []);
	assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x00]), [0x00]);
}

const tests = [testBlocks, testGraphemeCount, testAsciiQuotes];

function runTests() {
	for (let i = 0; i < tests.length; ++i) {
		const test = tests[i];
		try {
			test();
		} catch (e) {
			alert(`Test #${i + 1} failed: ${e}`);
			return;
		}
	}
	alert(`All ${tests.length} tests passed.`);
}
function updateRenderedCodepage() {
	const encodingName = selectedOption('codepageEncoding').textContent!;
	const encoding = global_encodings[encodingName];
	const isAscii = encoding.type == '7-bit mapping' || encoding.type == '7-bit wasm';
	let html = '<thead><th></th>';
	for (let i = 0; i < 16; ++i) {
		html += `<th>_${i.toString(16).toUpperCase()}</th>`;
	}
	html += '</thead><tbody>';
	for (let i = 0; i < (isAscii ? 8 : 16); ++i) {
		html += `<tr><td style="font-weight:bold">${i.toString(16).toUpperCase()}_</td>`;
		for (let j = 0; j < 16; ++j) {
			const byte = (i << 4) + j;
			const codepoints = encoding.decode!([byte]);
			if (codepoints && codepoints.length > 0) {
				const codepoint = codepoints[0];
				const colorClass =
					'char-row-category-' + wasm.get_character_category_code(codepoint)[0].toLowerCase();
				const displayedCodepoint = displayCodepoint(codepoint);
				html += `<td style="cursor: pointer" class="${colorClass}" onclick="showCodepageDetail(${codepoint})">${i
					.toString(16)
					.toUpperCase()}${j.toString(16).toUpperCase()}<br>${displayedCodepoint}</td>`;
			} else {
				html += `<td style="background-color: white">${i.toString(16).toUpperCase()}${j
					.toString(16)
					.toUpperCase()}<br>&nbsp;</td>`;
			}
		}
		html += '</tr>';
	}
	html += '</tbody>';
	getElementById('codepage').innerHTML = html;
}
function getElementById(id: string) {
	let element = document.getElementById(id);
	if (!element) {
		throw new Error(`Unable to find element #${id}`);
	}
	return element;
}

function selectedOption(selectId: string) {
	let elem = getElementById(selectId) as HTMLSelectElement;
	let options = elem.selectedOptions;
	if (options.length != 1) throw new Error('The number of selected options is not 1');
	return options[0];
}

function tryFillElement(id: string, value: string) {
	let element = getElementById(id);
	if (value) {
		element.style.display = '';
		let contentElement = getElementById(`${id}-content`);
		contentElement.textContent = value;
	} else {
		element.style.display = 'none';
	}
}

function showCodepageDetail(codepoint: number) {
	getElementById('detail-codepoint-hex').textContent = itos(codepoint, 16, 4);
	getElementById('detail-codepoint-decimal').textContent = codepoint.toString();
	getElementById('detail-name').innerText = `"${getName(codepoint)}"`;
	getElementById('detail-character').innerText = displayCodepoint(codepoint);
	getElementById('detail-character-raw').textContent = ctos([codepoint]);
	(getElementById('detail-character-textbox') as HTMLInputElement).value = ctos([codepoint]);
	getElementById('detail-category').textContent = `${wasm.get_character_category_code(
		codepoint,
	)} (${getCharacterCategoryName(codepoint)})`;
	getElementById('detail-basic-type').textContent = `${getCharacterBasicType(codepoint)}`;
	getElementById('detail-block').textContent = getBlockForCodepoint(codepoint).replace(/_/g, ' ');
	getElementById('detail-script').textContent = wasm.get_script(codepoint).replace(
		/_/g,
		' ',
	);
	const matchingAliases: string[] = [];
	for (let i = 0; i < global_aliases.length; ++i) {
		if (global_aliases[i].codepoint == codepoint) matchingAliases.push(global_aliases[i].alias);
	}
	tryFillElement('detail-aliases', matchingAliases.join(', '));
	tryFillElement('detail-meaning', global_han_meanings[codepoint]);
	tryFillElement('detail-mandarin', global_mandarin_readings[codepoint]);
	tryFillElement('detail-kun', global_kun_readings[codepoint]);
	tryFillElement('detail-on', global_on_readings[codepoint]);
	const variationSequences = variationSequencesForCodepoint(codepoint).concat(
		ideographicVariationSequencesForCodepoint(codepoint),
	);
	if (variationSequences.length === 0) {
		getElementById('detail-variation-sequences').style.display = 'none';
	} else {
		getElementById('detail-variation-sequences').style.display = '';
		let variationsString = '';
		for (let i = 0; i < variationSequences.length; ++i) {
			let vs = variationSequences[i];
			if (variationsString !== '') variationsString += '<br>';
			if (!vs.shapingEnvironments) vs.shapingEnvironments = [];
			variationsString += `U+${itos(vs.baseCodepoint, 16, 4)} U+${itos(
				vs.variationSelector,
				16,
				4,
			)}: ${escapeHtml(ctos([vs.baseCodepoint, vs.variationSelector]))} <i>${vs.description}`;
			if (vs.shapingEnvironments.length > 0) {
				variationsString += ` (${vs.shapingEnvironments.join(', ')})</i>`;
			} else {
				variationsString += '</i>';
			}
		}
		getElementById('detail-variation-sequences-content').innerHTML = variationsString;
	}

	let encodingsString = '';
	for (let elem of Array.from((getElementById('outputEncoding') as HTMLSelectElement).options)) {
		let encoding = elem.textContent;
		if (!encoding) {
			throw new Error('Unable to get encoding (via textContent) from element');
		}
		const html = encodeOutput(
			selectedOption('byteOrderMark').textContent!,
			encoding,
			selectedOption('outputFormat').textContent!,
			[codepoint],
		);
		if (html.startsWith('<span')) {
			continue;
		}
		encodingsString += `${encoding}: ${html}\n`;
	}

	getElementById('detail-encoding-outputs').innerHTML = encodingsString;

	getElementById('detail-previous-cp').dataset.cp = itos(previousCodepoint(codepoint), 10);
	getElementById('detail-next-cp').dataset.cp = itos(nextCodepoint(codepoint), 10);

	const codepointDetail = getElementById('codepoint-detail');
	let modalToggle = Modal.getOrCreateInstance(codepointDetail);
	modalToggle.show();
}
(window as any).showCodepageDetail = showCodepageDetail;

// called from button in modal dialog to navigate to a different codepoint
function changeDetail(elem: HTMLElement) {
	elem.blur(); // remove focus
	const attr = elem.dataset.cp;
	if (!attr) {
		throw new Error("Unable to find 'data-cp' attribute to find codepoint to jump to");
	}
	const codepointToShow = parseInt(attr, 10);
	showCodepageDetail(codepointToShow);
}
(window as any).changeDetail = changeDetail;
interface ButtonInfo {
	displayName: string; // text displayed on button
	functionName: string; // name of global function called on click

	// if provided, if it returns false for row i and row count length, button will be disabled
	require: (idx: number, length: number) => boolean;
}

function renderCodepointsInTable(codepoints: number[], tableId: string, buttons: ButtonInfo[]) {
	const table = getElementById(tableId);
	if (codepoints.length === 0) {
		table.innerHTML = '';
		return;
	}
	let langAttr = global_lang ? 'lang="${global_lang}"' : '';
	const transFlag = [127987, 65039, 8205, 9895, 65039];
	let isTrans = false;
	if (
		codepoints.length == transFlag.length &&
		codepoints.every((value, index) => value === transFlag[index])
	) {
		isTrans = true;
	}
	let html = `
  <thead>
    <tr>
      <th></th>
      <th>Codepoint (Hex)</th>
      <th>Codepoint (Decimal)</th>
      <th>Character</th>
      <th>Category</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>`;
	let i = 0;
	for (i = 0; i < codepoints.length; ++i) {
		const codepoint = codepoints[i];
		let buttonStr = '';
		for (const j in buttons) {
			const buttonDescription = buttons[j];
			let disabled = '';
			if (!buttonDescription.require(i, codepoints.length)) {
				disabled = 'disabled style="visibility:hidden;"';
			}
			buttonStr += `
      <div class="btn-group" role="group">
        <input
          type="button" ${disabled}
          onclick="${buttonDescription.functionName}(${codepoint}, ${i})"
          value="${buttonDescription.displayName}"
          class="btn btn-sm btn-outline-secondary">
      </div>`;
		}
		let colorClass = `char-row-category-${wasm.get_character_category_code(
			codepoint,
		)[0].toLowerCase()}`;
		if (isTrans) {
			if (i == 0 || i == 4) colorClass = 'trans-blue';
			else if (i == 1 || i == 3) colorClass = 'trans-pink';
			else if (i == 2) colorClass = 'trans-white';
		}
		html += `
    <tr class="${colorClass}">
      <td>${buttonStr}</td>
      <td>U+${itos(codepoint, 16, 4)}</td>
      <td>${codepoint}</td>
      <td class="lang-attr" ${langAttr}>${displayCodepoint(codepoint)}</td>
      <td>${getCharacterCategoryName(codepoint)}</td>
      <td style="cursor: pointer;" onclick="showCodepageDetail(${codepoint})">${getHtmlNameDescription(
			codepoint,
		)}</td>
    </tr>`;
	}
	if (i >= 256) {
		html += '<tr><td colspan="6">Showing only the first 256 rows.</td></tr>';
	}
	html += '</tbody>';
	table.style.display = 'none';
	table.innerHTML = html;
	table.style.display = '';
}

function updateCodepointList() {
	const codepoints = getStr();
	renderCodepointsInTable(codepoints, 'codepointlist', [
		{
			displayName: 'Delete',
			functionName: 'deleteAtIndex',
			require: () => true,
		},
		{
			displayName: '&#x2191;',
			functionName: 'moveUp',
			require: (i, length) => i != 0,
		},
		{
			displayName: '&#x2193;',
			functionName: 'moveDown',
			require: (i, length) => i != length - 1,
		},
	]);
}
function updateEncodedAndDecodedStrings() {
	const codepoints = getStr();
	getElementById('encodedOutput').innerHTML = encodeOutput(
		selectedOption('byteOrderMark').textContent!,
		selectedOption('outputEncoding').textContent!,
		selectedOption('outputFormat').textContent!,
		codepoints,
	);

	const decodedOutput = decodeOutput(
		selectedOption('byteOrderMark').textContent!,
		selectedOption('outputEncoding').textContent!,
		selectedOption('outputFormat').textContent!,
		(getElementById('encodedInput') as HTMLInputElement).value,
	);
	if (decodedOutput)
		renderCodepointsInTable(decodedOutput, 'decodedCodepoints', [
			{
				displayName: 'Insert',
				functionName: 'output',
				require: () => true,
			},
		]);
}

function saveToSlot(slotNumber: number) {
	try {
		let str = ctos(getStr());
		if (str) {
			localStorage.setItem(`slot${slotNumber}`, str);
			alert(`Stored string in slot ${slotNumber}.`);
			return;
		}
	} catch {}
	alert('Failed to store string!');
}
(window as any).saveToSlot = saveToSlot;

function loadFromSlot(slotNumber: number) {
	let str = localStorage.getItem(`slot${slotNumber}`);
	if (!str) {
		alert(`Couldn't find anything in slot ${slotNumber}!`);
		return;
	}
	setStr(stoc(str));
	alert(`Successfully loaded string from slot ${slotNumber}.`);
}
(window as any).loadFromSlot = loadFromSlot;

function hexadecimalPaddingFromEncoding(encoding: string) {
	if (encoding.includes('16-bit code units')) return 4;
	if (encoding.includes('32-bit code units')) return 8;
	return 2;
}

function updateEncodedLengths() {
	const codepoints = getStr();
	getElementById('extendedGraphemeClusters').textContent = countGraphemesForCodepoints(
		codepoints,
	).toString();
	getElementById('numCodepoints').textContent = codepoints.length.toString();
	let encodingLengthsStr =
		'<thead><tr>' +
		'<th>Encoding</th>' +
		'<th>Number of code units</th>' +
		'<th>Number of bytes</th>' +
		'<th>Number of code units (incl. BOM)</th>' +
		'<th>Number of bytes (incl. BOM)</th>' +
		'</tr></thead><tbody>';
	let bomCodepoints = [0xfeff];
	for (let i = 0; i < codepoints.length; ++i) {
		bomCodepoints.push(codepoints[i]);
	}
	for (const name in global_encodings) {
		const encoding = global_encodings[name];
		const codeUnits = encoding.encode!(codepoints);
		const cellEntries = ['', '', '', ''];
		if (typeof codeUnits === 'number') {
			cellEntries[0] = `<span style="color:red">Unable to encode U+${itos(
				codeUnits,
				16,
				4,
			)}</span>`;
			cellEntries[3] = cellEntries[2] = cellEntries[1] = cellEntries[0];
		} else {
			cellEntries[0] = `${codeUnits.length} code units`;
			cellEntries[1] = `${
				(codeUnits.length * hexadecimalPaddingFromEncoding(name)) / 2
			} bytes`;
			let bomCodeUnits = encoding.encode!(bomCodepoints);
			if (typeof bomCodeUnits === 'number') {
				cellEntries[3] = cellEntries[2] =
					'<span style="color:red">Unable to encode BOM (U+FEFF)</span>';
			} else {
				cellEntries[2] = `${bomCodeUnits.length} code units`;
				cellEntries[3] = `${
					(bomCodeUnits.length * hexadecimalPaddingFromEncoding(name)) / 2
				} bytes`;
			}
		}
		encodingLengthsStr += `<tr><td>${name}</td><td>${cellEntries.join('</td><td>')}</td></tr>`;
	}
	getElementById('encodingLengths').innerHTML = encodingLengthsStr + '</tbody>';
	getElementById('string').innerHTML = escapeHtml(ctos(getStr())).replace(/\n/g, '<br>');
}
function updateMojibake() {
	const codepoints = getStr();
	const mojibakeOutputs: {
		encoding1Name: string;
		encoding2Name: string;
		text: string;
	}[] = [];
	const mojibakeEncodings = Array.from(
		(getElementById('mojibakeEncodings') as HTMLSelectElement).options,
	);
	for (const i in mojibakeEncodings) {
		const e = mojibakeEncodings[i];
		if (!e.selected) continue;
		const encoding1Name = e.textContent!;
		if (global_encodings[encoding1Name].type == 'text function') continue;
		const encodedString = encodeOutput(
			"Don't use a byte order mark",
			encoding1Name,
			'Decimal',
			codepoints,
		);
		if (encodedString.startsWith('<')) continue;
		for (const j in mojibakeEncodings) {
			const f = mojibakeEncodings[j];
			if (i == j) continue;
			if (!f.selected) continue;
			const encoding2Name = f.textContent!;
			if (global_encodings[encoding2Name].type == 'text function') continue;
			const decodedString = decodeOutput(
				"Don't use a byte order mark",
				encoding2Name,
				'Decimal',
				encodedString,
			);
			if (!decodedString) continue;
			mojibakeOutputs.push({
				encoding1Name: encoding1Name,
				encoding2Name: encoding2Name,
				text: ctos(decodedString),
			});
		}
	}
	let mojibakeOutputStr = '';
	let lastEncoding1 = '';
	for (let i = 0; i < mojibakeOutputs.length; ++i) {
		const o = mojibakeOutputs[i];
		if (o.encoding1Name != lastEncoding1) {
			lastEncoding1 = o.encoding1Name;
			mojibakeOutputStr += `Assuming the input was erroneously interpreted as ${o.encoding1Name}:<br>`;
		}
		mojibakeOutputStr += `    If the original encoding was ${o.encoding2Name}:<br>        ${mojibakeOutputs[i].text}<br>`;
	}
	getElementById('mojibakeOutput').innerHTML = mojibakeOutputStr;
}
let global_lang: string = '';

function updateLanguage() {
	let lang = '';
	const languageCodeElem = getElementById('languageCode') as HTMLInputElement;
	let textboxCode = languageCodeElem.value;
	let dropdownCode = '';
	const langComponentStrings = [
		selectedOption('languageList').dataset.code,
		selectedOption('scriptList').dataset.code,
		selectedOption('regionList').dataset.code,
		selectedOption('variantList').dataset.code,
	];
	for (let i = 0; i < langComponentStrings.length; ++i) {
		const component = langComponentStrings[i];
		if (!component) continue;
		if (dropdownCode != '') dropdownCode += '-';
		dropdownCode += component;
	}
	// valid states:
	//   everything enabled, textboxCode and dropdownCode empty
	//   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
	//   dropdownCode empty: dropdown disabled

	if (languageCodeElem.hasAttribute('disabled')) {
		languageCodeElem.value = ''; // occurs when dropdownCode is reset to blank
		textboxCode = languageCodeElem.value;
	}

	if (textboxCode == '' && dropdownCode == '') {
		languageCodeElem.removeAttribute('disabled');
		getElementById('languageList').removeAttribute('disabled');
		getElementById('scriptList').removeAttribute('disabled');
		getElementById('regionList').removeAttribute('disabled');
		getElementById('variantList').removeAttribute('disabled');
		lang = '';
	} else if (textboxCode == '' && dropdownCode != '') {
		languageCodeElem.setAttribute('disabled', 'disabled');
		getElementById('languageList').removeAttribute('disabled');
		getElementById('scriptList').removeAttribute('disabled');
		getElementById('regionList').removeAttribute('disabled');
		getElementById('variantList').removeAttribute('disabled');
		lang = dropdownCode;
		languageCodeElem.value = lang;
	} else if (textboxCode != '' && dropdownCode == '') {
		languageCodeElem.removeAttribute('disabled');
		getElementById('languageList').setAttribute('disabled', 'disabled');
		getElementById('scriptList').setAttribute('disabled', 'disabled');
		getElementById('regionList').setAttribute('disabled', 'disabled');
		getElementById('variantList').setAttribute('disabled', 'disabled');
		lang = textboxCode;
	} else {
		if (languageCodeElem.hasAttribute('disabled')) {
			lang = dropdownCode;
			languageCodeElem.value = lang;
		} else {
			lang = textboxCode;
		}
	}

	triggerChosenUpdate('languageList');
	triggerChosenUpdate('scriptList');
	triggerChosenUpdate('regionList');
	triggerChosenUpdate('variantList');

	let elems = document.getElementsByClassName('lang-attr');
	for (let i = 0; i < elems.length; ++i) {
		if (lang) {
			elems[i].setAttribute('lang', lang);
		} else {
			elems[i].removeAttribute('lang');
		}
	}
	global_lang = lang;
}

function updateUseInternalString() {
	global_useInternalString = (getElementById('useInternalString') as HTMLInputElement).checked;
}
function displayCodepoint(codepoint?: number): string {
	if (typeof codepoint == 'undefined') return '';
	if (codepoint < 0x20) codepoint += 0x2400;
	if (codepoint == 0x7f) codepoint = 0x2421;
	if (codepoint >= 0xd800 && codepoint <= 0xdfff) {
		// surrogate
		return '';
	}
	let codepoints = [codepoint];
	if (wasm.get_grapheme_break_data(codepoint) == 'Extend') codepoints = [0x25cc, codepoint];
	return escapeHtml(ctos(codepoints));
}

function triggerChosenUpdate(id: string) {
	let elem = getElementById(id);
	let event = new CustomEvent('chosen:updated');
	elem.dispatchEvent(event);
}

function updateSelectOptions(id: string, options: Node[]) {
	let elem = getElementById(id);
	elem.replaceChildren(...options);
	triggerChosenUpdate(id);
}

function variationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	for (let i = 0; i < global_variationSequences.length; ++i) {
		if (global_variationSequences[i].baseCodepoint == codepoint)
			results.push(global_variationSequences[i]);
	}
	return results;
}

function urlForIdeographicCollection(name: string) {
	for (let i = 0; i < global_ideographicVariationCollections.length; ++i) {
		const collection = global_ideographicVariationCollections[i];
		if (collection.name != name) continue;
		return collection.url;
	}
}

function ideographicVariationSequencesForCodepoint(codepoint: number) {
	const results: VariationSequence[] = [];
	const seqs_from_wasm = JSON.parse(wasm.variation_sequences_for_codepoint(codepoint));
	for (let i = 0; i < seqs_from_wasm.length; ++i) {
		var ivs = seqs_from_wasm[i];
		results.push({
			baseCodepoint: ivs.base_codepoint,
			variationSelector: ivs.variation_selector,
			description: `ideographic (entry ${
				ivs.item
			} in collection <a target="_blank" rel="noopener" href="${urlForIdeographicCollection(
				ivs.collection,
			)}">${ivs.collection}</a>)`,
		});
	}
	return results;
}

function initBindings() {
	const runTestsButton = document.getElementById('runTests');
	runTestsButton?.addEventListener('click', runTests);
}
