function displayCodepoint(codepoint?: number): string {
	if (typeof codepoint == `undefined`)
		return ``;
	if (codepoint < 0x20)
		codepoint += 0x2400;
	if (codepoint == 0x7F)
		codepoint = 0x2421;
	let codepoints = [codepoint];
	if (graphemeBreakValueForCodepoint(codepoint) == `Extend`)
		codepoints = [0x25CC, codepoint];
	return escapeHtml(ctos(codepoints));
}

function updateSelectOptions(selector: string, html: string) {
	$(selector).html(html);
	$(selector).trigger(`chosen:updated`);
}
