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
