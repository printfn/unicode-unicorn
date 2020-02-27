function hexadecimalPaddingFromEncoding(encoding: string) {
	if (encoding.includes(`16-bit code units`))
		return 4;
	if (encoding.includes(`32-bit code units`))
		return 8;
	return 2;
}

function updateEncodedLengths() {
	const codepoints = getStr();
	getElementById('extendedGraphemeClusters').textContent = countGraphemesForCodepoints(codepoints, 'extended').toString();
	getElementById('legacyGraphemeClusters').textContent = countGraphemesForCodepoints(codepoints, 'legacy').toString();
	getElementById('numCodepoints').textContent = codepoints.length.toString();
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
	getElementById('encodingLengths').innerHTML = encodingLengthsStr + `</tbody>`;
	getElementById('string').innerHTML = escapeHtml(ctos(getStr())).replace(/\n/g, `<br>`);
}
