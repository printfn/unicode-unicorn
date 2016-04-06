function assert(expr, message) {
	if (!expr)
		throw message;
}

function assertEqual(actual, expected, otherInfo) {
	if (actual != expected)
		throw 'Expected ' + actual + ' to be equal to ' + expected + ': ' + otherInfo;
}

var tests = [
	function() {
		for (var cp = 0; cp < 0x300; ++cp) {
			var block = getBlockForCodepoint(cp);
			if (cp <= 0x7F)
				assertEqual(block, 'Basic Latin', 'Codepoint ' + itos(cp, 16, 4));
			else if (cp <= 0xFF)
				assertEqual(block, 'Latin-1 Supplement', 'Codepoint ' + itos(cp, 16, 4));
			else if (cp <= 0x17F)
				assertEqual(block, 'Latin Extended-A', 'Codepoint ' + itos(cp, 16, 4));
			else if (cp <= 0x24F)
				assertEqual(block, 'Latin Extended-B', 'Codepoint ' + itos(cp, 16, 4));
			else if (cp <= 0x2AF)
				assertEqual(block, 'IPA Extensions', 'Codepoint ' + itos(cp, 16, 4));
			else if (cp <= 0x2FF)
				assertEqual(block, 'Spacing Modifier Letters', 'Codepoint ' + itos(cp, 16, 4));
		}
	}
];

function runTests() {
	for (var i = 0; i < tests.length; ++i) {
		var test = tests[i];
		try {
			test();
		} catch (e) {
			$('#unit-tests-text').text('Test #' + (i + 1) + ' failed: ' + e);
			$('#unit-tests-modal').modal('show');
			return;
		}
	}
	$('#unit-tests-text').text('All ' + tests.length + ' tests passed.');
	$('#unit-tests-modal').modal('show');
}