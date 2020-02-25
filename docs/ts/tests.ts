function assert(expr: boolean, message: string) {
	if (!expr)
		throw message;
}

function assertEqual(actual: any, expected: any, otherInfo?: string) {
	if (actual != expected)
		throw `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
}

function testBlocks() {
	for (let cp = 0; cp < 0x300; ++cp) {
		const block = getBlockForCodepoint(cp);
		if (cp <= 0x7F)
			assertEqual(block, `Basic Latin`, `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0xFF)
			assertEqual(block, `Latin-1 Supplement`, `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x17F)
			assertEqual(block, `Latin Extended-A`, `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x24F)
			assertEqual(block, `Latin Extended-B`, `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x2AF)
			assertEqual(block, `IPA Extensions`, `Codepoint ${itos(cp, 16, 4)}`);
		else if (cp <= 0x2FF)
			assertEqual(block, `Spacing Modifier Letters`, `Codepoint ${itos(cp, 16, 4)}`);
	}
}

function testGraphemeCount() {
	assertEqual(countGraphemesForCodepoints([128104, 8205, 10084, 65039, 8205, 128104], 'extended'), 1);
	assertEqual(countGraphemesForCodepoints([
		128104, 8205, 10084, 65039, 8205, 128104,
		128104, 8205, 10084, 65039, 8205, 128104,
		128104, 8205, 10084, 65039, 8205, 128104], 'extended'), 3);
	assertEqual(countGraphemesForCodepoints([127464, 127467, 127470, 127464, 127463, 127481, 127464], 'extended'), 4);
}

const tests = [ testBlocks, testGraphemeCount ];

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