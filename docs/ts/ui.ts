declare function randomColor(desc: { luminosity?: string; }): string;

let global_colorMap: { [key: string]: string; } = {
	'C': `#f97e77`,
	'L': `#f9e776`,
	'N': `#b7f976`,
	'P': `#76f9ee`,
	'S': `#7680f9`,
	'Z': `#a8a8a8`,
};

interface ButtonInfo {
	displayName: string; // text displayed on button
	functionName: string; // name of global function called on click

	// if provided, if it returns false for row i and row count length, button will be disabled
	require?: (idx: number, length: number) => boolean;
}

function renderCodepointsInTable(codepoints: number[], tableId: string, buttons: ButtonInfo[]) {
	const table = $(`#${tableId}`);
	if (codepoints.length === 0) {
		table.html(``);
		return;
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
		let buttonStr = ``;
		for (const j in buttons) {
			const buttonDescription = buttons[j];
			let disabled = ``;
			if (buttonDescription.require) {
				if (!buttonDescription.require(i, codepoints.length)) {
					disabled = `disabled`;
				}
			}
			buttonStr += `<input
				type="button" ${disabled}
				onclick="${buttonDescription.functionName}(${codepoint}, ${i})"
				value="${buttonDescription.displayName}">`;
		}
		html += `
		<tr>
			<td>${buttonStr}</td>
			<td>U+${itos(codepoint, 16, 4)}</td>
			<td>${codepoint}</td>
			<td>${displayCodepoint(codepoint)}</td>
			<td>${getCharacterCategoryName(codepoint)}</td>
			<td style="cursor: pointer;" onclick="showCodepageDetail(${codepoint})">${
				getHtmlNameDescription(codepoint)
			}</td>
		</tr>`;
	}
	if (i >= 256) {
		html += `<tr><td colspan="6">Showing only the first 256 rows.</td></tr>`;
	}
	html += `</tbody>`;
	table.hide();
	table.html(html);
	table.show();
}

function randomColorForKey(key: string): string {
	if (global_colorMap[key]) {
		return global_colorMap[key];
	}
	return global_colorMap[key] = randomColor({ // format: "#a0ff9b"
		luminosity: `light`
	});
}

function updateRenderedCodepage() {
	const encodingName = $(`#codepageEncoding option:selected`).text();
	const encoding = global_encodings[encodingName];
	const isAscii = encoding.type == `7-bit mapping`;
	let html = `<thead><th></th>`;
	for (let i = 0; i < 16; ++i) {
		html += `<th>_${i.toString(16).toUpperCase()}</th>`;
	}
	html += `</thead><tbody>`;
	for (let i = 0; i < (isAscii ? 8 : 16); ++i) {
		html += `<tr><td style="font-weight:bold">${i.toString(16).toUpperCase()}_</td>`;
		for (let j = 0; j < 16; ++j) {
			const byte = (i << 4) + j;
			const codepoints = encoding.decode!([byte]);
			if (codepoints && codepoints.length > 0) {
				const codepoint = codepoints[0];
				const color = randomColorForKey(getCharacterCategoryCode(codepoint)[0]);
				const displayedCodepoint = displayCodepoint(codepoint);
				html += `<td style="cursor: pointer; background-color: ${color};" onclick="showCodepageDetail(${codepoint})">${
					i.toString(16).toUpperCase()}${j.toString(16).toUpperCase()
				}<br>${displayedCodepoint}</td>`;
			} else {
				html += `<td style="background-color: white">${i.toString(16).toUpperCase()}${j.toString(16).toUpperCase()}<br>&nbsp;</td>`;
			}
		}
		html += `</tr>`;
	}
	html += `</tbody>`;
	$(`#codepage`).html(html);
}

function showCodepageDetail(codepoint: number) {
	$(`#detail-codepoint-hex`).text(itos(codepoint, 16, 4));
	$(`#detail-codepoint-decimal`).text(codepoint);
	$(`#detail-name`).html(`"${getName(codepoint)}"`);
	$(`#detail-character`).html(displayCodepoint(codepoint));
	$(`#detail-character-raw`).text(ctos([codepoint]));
	$(`#detail-character-textbox`).val(ctos([codepoint]));
	$(`#detail-category`).text(`${getCharacterCategoryCode(codepoint)} (${getCharacterCategoryName(codepoint)})`);
	$(`#detail-block`).text(getBlockForCodepoint(codepoint).replace(/_/g, ` `));
	$(`#detail-script`).text(getScriptForCodepoint(codepoint).replace(/_/g, ` `));
	const matchingAliases: string[] = [];
	for (let i = 0; i < global_aliases.length; ++i) {
		if (global_aliases[i].codepoint == codepoint)
			matchingAliases.push(global_aliases[i].alias);
	}
	if (matchingAliases.length === 0) {
		$(`#detail-aliases`).hide();
	} else {
		$(`#detail-aliases`).show();
		$(`#detail-aliases-list`).text(matchingAliases.join(`, `));
	}
	const meaning = global_han_meanings[codepoint];
	if (meaning) {
		$(`#detail-meaning`).show();
		$(`#detail-meaning-content`).text(meaning);
	} else {
		$(`#detail-meaning`).hide();
	}
	const mandarin = global_mandarin_readings[codepoint];
	if (mandarin) {
		$(`#detail-mandarin`).show();
		$(`#detail-mandarin-content`).text(mandarin);
	} else {
		$(`#detail-mandarin`).hide();
	}
	const kun = global_kun_readings[codepoint];
	if (kun) {
		$(`#detail-kun`).show();
		$(`#detail-kun-content`).text(kun);
	} else {
		$(`#detail-kun`).hide();
	}
	const on = global_on_readings[codepoint];
	if (on) {
		$(`#detail-on`).show();
		$(`#detail-on-content`).text(on);
	} else {
		$(`#detail-on`).hide();
	}
	const variationSequences = variationSequencesForCodepoint(codepoint).concat(ideographicVariationSequencesForCodepoint(codepoint));
	if (variationSequences.length === 0) {
		$(`#detail-variation-sequences`).hide();
	} else {
		$(`#detail-variation-sequences`).show();
		let variationsString = ``;
		for (let i = 0; i < variationSequences.length; ++i) {
			let vs = variationSequences[i];
			if (variationsString !== ``)
				variationsString += `<br>`;
			if (!vs.shapingEnvironments)
				vs.shapingEnvironments = [];
			variationsString += `U+${itos(vs.baseCodepoint, 16, 4)
			} U+${itos(vs.variationSelector, 16, 4)
			}: ${escapeHtml(ctos([vs.baseCodepoint, vs.variationSelector]))} <i>${vs.description}`;
			if (vs.shapingEnvironments.length > 0) {
				variationsString += ` (${vs.shapingEnvironments.join(`, `)})</i>`;
			} else {
				variationsString += `</i>`;
			}
		}
		$(`#detail-variation-sequences-content`).html(variationsString);
	}

	let encodingsString = ``;
	$(`#outputEncoding option`).each(function(i, e) {
		const encoding = $(e).text();
		const html = encodeOutput(
			$(`#byteOrderMark option:selected`).text(),
			encoding,
			$(`#outputFormat option:selected`).text(),
			[codepoint]
		);
		if (html.startsWith(`<span`))
			return;
		encodingsString += `${encoding}: ${html}\n`;
	});

	$(`#detail-encoding-outputs`).html(encodingsString);

	$(`#detail-previous-cp`).attr(`data-cp`, codepoint != 0 ? itos(codepoint - 1, 10) : itos(0x10FFFF, 10));
	$(`#detail-next-cp`).attr(`data-cp`, codepoint != 0x10FFFF ? itos(codepoint + 1, 10) : itos(0, 10));
	
	jQueryModal(`#codepoint-detail`, `show`);
}

function changeDetail(elem: HTMLElement) {
	$(elem).blur(); // remove focus
	const codepointToShow = parseInt($(elem).attr(`data-cp`), 10);
	showCodepageDetail(codepointToShow);
}

function initLicenseInfo(completion: () => void) {
	requestAsync(`data/licenses.html`, function(lines) {
		$(`#licenses-text`).html(lines.join(`\n`));
		completion();
	});
}

function updateMojibake() {
	const codepoints = getStr();
	const mojibakeOutputs: { encoding1Name: string, encoding2Name: string, text: string }[] = [];
	$(`#mojibakeEncodings option`).each(function(i: number, e: Element & { selected: boolean; }) {
		if (!e.selected)
			return;
		const encoding1Name = $(e).text();
		if (global_encodings[encoding1Name].type == `text function`)
			return;
		const encodedString = encodeOutput(
			`Don't use a byte order mark`,
			encoding1Name,
			`Decimal`,
			codepoints);
		if (encodedString.startsWith(`<`))
			return;
		$(`#mojibakeEncodings option`).each(function(j: number, f: Element & { selected: boolean; }) {
			if (i == j)
				return;
			if (!f.selected)
				return;
			const encoding2Name = $(f).text();
			if (global_encodings[encoding2Name].type == `text function`)
				return;
			const decodedString = decodeOutput(
				`Don't use a byte order mark`,
				encoding2Name,
				`Decimal`,
				encodedString);
			if (!decodedString)
				return;
			mojibakeOutputs.push({
				encoding1Name: encoding1Name,
				encoding2Name: encoding2Name,
				text: ctos(decodedString)
			});
		});
	});
	let mojibakeOutputStr = ``;
	let lastEncoding1 = ``;
	for (let i = 0; i < mojibakeOutputs.length; ++i) {
		const o = mojibakeOutputs[i];
		if (o.encoding1Name != lastEncoding1) {
			lastEncoding1 = o.encoding1Name;
			mojibakeOutputStr += `Assuming the input was erroneously interpreted as ${o.encoding1Name}:<br>`;
		}
		mojibakeOutputStr += `    If the original encoding was ${o.encoding2Name}:<br>        ${mojibakeOutputs[i].text}<br>`;
	}
	$(`#mojibakeOutput`).html(mojibakeOutputStr);
}

function hexadecimalPaddingFromEncoding(encoding: string) {
    if (encoding.includes(`16-bit code units`))
        return 4;
    if (encoding.includes(`32-bit code units`))
        return 8;
    return 2;
}

function updateEncodedLengths() {
	const codepoints = getStr();
	$(`#extendedGraphemeClusters`).text(countGraphemesForCodepoints(codepoints, true));
	$(`#legacyGraphemeClusters`).text(countGraphemesForCodepoints(codepoints, false));
	$(`#numCodepoints`).text(codepoints.length);
	let encodingLengthsStr =
		`<thead><tr>` +
		`<th>Encoding</th>` +
		`<th>Number of code units</th>` +
		`<th>Number of bytes</th>` +
		`<th>Number of code units (incl. BOM)</th>` +
		`<th>Number of bytes (incl. BOM)</th>` +
		`</tr></thead><tbody>`;
	let bomCodepoints = [0xFEFF];
	for (let i = 0; i < codepoints.length; ++i) {
		bomCodepoints.push(codepoints[i]);
	}
	for (const name in global_encodings) {
		const encoding = global_encodings[name];
		const codeUnits = encoding.encode!(codepoints);
		const cellEntries = [``, ``, ``, ``];
		if (typeof codeUnits === `number`) {
			cellEntries[0] = `<span style="color:red">Unable to encode U+${itos(codeUnits, 16, 4)}</span>`;
			cellEntries[3] = cellEntries[2] = cellEntries[1] = cellEntries[0];
		} else {
			cellEntries[0] = `${codeUnits.length} code units`;
			cellEntries[1] = `${codeUnits.length * hexadecimalPaddingFromEncoding(name) / 2} bytes`;
			let bomCodeUnits = encoding.encode!(bomCodepoints);
			if (typeof bomCodeUnits === `number`) {
				cellEntries[3] = cellEntries[2] = `<span style="color:red">Unable to encode BOM (U+FEFF)</span>`;
			} else {
				cellEntries[2] = `${bomCodeUnits.length} code units`;
				cellEntries[3] = `${bomCodeUnits.length * hexadecimalPaddingFromEncoding(name) / 2} bytes`;
			}
		}
		encodingLengthsStr += `<tr><td>${name}</td><td>${cellEntries.join(`</td><td>`)}</td></tr>`;
	}
	$(`#encodingLengths`).html(encodingLengthsStr + `</tbody>`);
	$(`#string`).html(escapeHtml(ctos(getStr())).replace(/\n/g, `<br>`));
}

function updateCodepointList() {
	const codepoints = getStr();
	renderCodepointsInTable(codepoints, `codepointlist`, [{
		displayName: `Delete`,
		functionName: `deleteAtIndex`
	}, {
		displayName: `Move up`,
		functionName: `moveUp`,
		require: function(i, length) { return i != 0; }
	}, {
		displayName: `Move down`,
		functionName: `moveDown`,
		require: function(i, length) { return i != length - 1; }
	}]);
}

function updateEncodedAndDecodedStrings() {
	const codepoints = getStr();
	$(`#encodedOutput`).html(encodeOutput(
		$(`#byteOrderMark option:selected`).text(),
		$(`#outputEncoding option:selected`).text(),
		$(`#outputFormat option:selected`).text(),
		codepoints
	));

	const decodedOutput = decodeOutput(
		$(`#byteOrderMark option:selected`).text(),
		$(`#outputEncoding option:selected`).text(),
		$(`#outputFormat option:selected`).text(),
		$(`#encodedInput`).val()
	);
	if (decodedOutput)
		renderCodepointsInTable(
			decodedOutput,
			`decodedCodepoints`,
			[{displayName: `Insert`, functionName: `output`}]);
}

function updateLanguage() {
	let lang = ``;
	const textboxCode = $(`#languageCode`).val();
	let dropdownCode = ``;
	const langComponentStrings = [
		$(`#languageList option:selected`).attr(`data-code`),
		$(`#scriptList option:selected`).attr(`data-code`),
		$(`#regionList option:selected`).attr(`data-code`),
		$(`#variantList option:selected`).attr(`data-code`)
	];
	for (let i = 0; i < langComponentStrings.length; ++i) {
		const component = langComponentStrings[i];
		if (!component)
			continue;
		if (dropdownCode != ``)
			dropdownCode += `-`;
		dropdownCode += component;
	}
	// valid states:
	//   everything enabled, textboxCode and dropdownCode empty
	//   dropdownCode non-empty: textboxCode set to dropdownCode, textbox disabled
	//   dropdownCode empty: dropdown disabled

	if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
		$(`#languageCode`).val(``); // occurs when dropdownCode is reset to blank
	}
		
	if (textboxCode == `` && dropdownCode == ``) {
		$(`#languageCode`).removeAttr(`disabled`);
		$(`#languageList`).removeAttr(`disabled`);
		$(`#scriptList`).removeAttr(`disabled`);
		$(`#regionList`).removeAttr(`disabled`);
		$(`#variantList`).removeAttr(`disabled`);
		lang = ``;
	} else if (textboxCode == `` && dropdownCode != ``) {
		$(`#languageCode`).attr(`disabled`, `disabled`);
		$(`#languageList`).removeAttr(`disabled`);
		$(`#scriptList`).removeAttr(`disabled`);
		$(`#regionList`).removeAttr(`disabled`);
		$(`#variantList`).removeAttr(`disabled`);
		lang = dropdownCode;
		$(`#languageCode`).val(lang);
	} else if (textboxCode != `` && dropdownCode == ``) {
		$(`#languageCode`).removeAttr(`disabled`);
		$(`#languageList`).attr(`disabled`, `disabled`);
		$(`#scriptList`).attr(`disabled`, `disabled`);
		$(`#regionList`).attr(`disabled`, `disabled`);
		$(`#variantList`).attr(`disabled`, `disabled`);
		lang = textboxCode;
	} else {
		if ($(`#languageCode`)[0].hasAttribute(`disabled`)) {
			lang = dropdownCode;
			$(`#languageCode`).val(lang);
		} else {
			lang = textboxCode;
		}
	}
	
	$(`html`).attr(`lang`, lang);
	$(`html`).attr(`xml:lang`, lang);
}

function updateUseInternalString() {
	global_useInternalString = $(`#useInternalString`).is(`:checked`);
}

function updateSelectOptions(selector: string, html: string) {
	$(selector).html(html);
	$(selector).trigger(`chosen:updated`);
}

function saveToSlot(slotNumber: number) {
	try {
		let str = ctos(getStr());
		if (str) {
			localStorage.setItem(`slot${slotNumber}`, str);
			alert(`Stored string in slot ${slotNumber}.`);
			return;
		}
	} catch {
	}
	alert('Failed to store string!');
}

function loadFromSlot(slotNumber: number) {
	let str = localStorage.getItem(`slot${slotNumber}`);
	if (!str) {
		alert(`Couldn't find anything in slot ${slotNumber}!`);
		return;
	}
	setStr(stoc(str));
	alert(`Successfully loaded string from slot ${slotNumber}.`);
}
